"""Novel Forge local-only editor + optional diffusion backend. Python 3.10+."""
import base64, hashlib, io, json, os, re, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
HOST = '127.0.0.1'
PORT = int(os.getenv('FORGE_PORT', '8765'))
MODEL = os.getenv('FORGE_MODEL', 'stabilityai/sd-turbo')
LOCK = threading.Lock()
PIPE = None
ANCHORS = ROOT / 'character-anchors'
ANCHORS.mkdir(exist_ok=True)

def pipeline():
    global PIPE
    if PIPE is None:
        import torch
        from diffusers import AutoPipelineForText2Image
        if not torch.cuda.is_available():
            raise RuntimeError('A CUDA-compatible GPU is required for the bundled default configuration. Install a compatible backend or use a hosted image server.')
        PIPE = AutoPipelineForText2Image.from_pretrained(MODEL, torch_dtype=torch.float16).to('cuda')
        PIPE.set_progress_bar_config(disable=True)
    return PIPE

def make_image(payload):
    prompt = str(payload.get('prompt','')).strip()[:1800]
    if not prompt:
        raise ValueError('A character description is required')
    cid = re.sub(r'[^a-zA-Z0-9_-]','_',str(payload.get('character_id','new-character')))[:64]
    seed = int(payload.get('seed', 42)) % (2**32)
    import torch
    from PIL import Image
    key = hashlib.sha256((cid+'|'+MODEL).encode()).hexdigest()[:22]
    anchor = ANCHORS / (key+'.png')
    outfit = str(payload.get('outfit','Casual'))[:80]
    expression = str(payload.get('expression','Smile'))[:80]
    full = f'Photorealistic portrait of a fictional adult at least 21 years old, {prompt}. Outfit: {outfit}. Expression: {expression}. Natural realistic skin and studio-quality photographic lighting.'
    with LOCK:
        generator = torch.Generator(device='cuda').manual_seed(seed)
        # Reusing an anchor with img2img helps preserve composition/appearance;
        # it does not guarantee facial identity across new poses.
        if anchor.is_file() and payload.get('identity_lock', True):
            from diffusers import AutoPipelineForImage2Image
            p = AutoPipelineForImage2Image.from_pipe(pipeline())
            image = Image.open(anchor).convert('RGB').resize((512,512))
            result = p(prompt=full, image=image, strength=0.43, num_inference_steps=6, guidance_scale=0.0, generator=generator).images[0]
        else:
            result = pipeline()(prompt=full, num_inference_steps=4, guidance_scale=0.0, width=512, height=512, generator=generator).images[0]
            result.save(anchor)
    b = io.BytesIO()
    result.save(b, format='PNG')
    return {'data_url':'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode(), 'mime_type':'image/png','character_id':cid,'seed':seed}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        if urlparse(self.path).path == '/api/health':
            return self.json_reply(200, {'status':'ok','model':MODEL,'model_loaded':PIPE is not None,'local_only':True})
        return super().do_GET()
    def json_reply(self, code, data):
        result=json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(result)))
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        self.wfile.write(result)
    def do_POST(self):
        if urlparse(self.path).path != '/api/generate-image':
            return self.json_reply(404, {'error':'Not found'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size <= 0 or size > 16000: raise ValueError('Invalid request size')
            payload=json.loads(self.rfile.read(size))
            if not isinstance(payload,dict): raise ValueError('Invalid JSON')
            return self.json_reply(200,make_image(payload))
        except Exception as e:
            return self.json_reply(422,{'error':str(e)[:350]})

if __name__=='__main__':
    print(f'Novel Forge: http://{HOST}:{PORT}/ (local-only)')
    print('Install requirements-ai.txt and download model weights on first generation.')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
