'use strict';
const studios = [
 {name:'Video',icon:'vid',summary:'Generate clips, review them and assemble a final cut.',models:'MiniMax H3 · LTX-2.5 · GPU Whisper',detail:'Direct generation or agentic planning, rendering and review. Post-edit, montage and GPU Whisper captions help carry a clip into a finished sequence.'},
 {name:'Image',icon:'krea',summary:'Reference images, repeatable looks and LoRA support.',models:'Krea 2 Turbo · Anima · Qwen Image',detail:'Work with prompts and reference images in a focused studio over ComfyUI. Add LoRAs to keep a subject or visual treatment consistent.'},
 {name:'Music',icon:'mus',summary:'Create songs from a style brief and lyrics.',models:'YuE2 · MiniMax Music 3',detail:'Bring the musical direction and lyrics. Music generation shares the same GPU queue as your image and video work.'},
 {name:'Voice',icon:'voice',summary:'Speech generation and character voices.',models:'Qwen3-TTS · reference audio cleanup',detail:'Generate speech and voice characters. GPU music removal can clean a reference clip before it becomes part of the voice workflow.'},
 {name:'Motion',icon:'vid',summary:'Code-driven titles, overlays and kinetic typography.',models:'Remotion · React · ffmpeg / VA-API',detail:'Render React-based motion projects with Chrome frame rendering and hardware-assisted video encoding. Useful for title cards and overlays around generated media.'},
 {name:'Trainer',icon:'trainer',summary:'Train LoRAs with managed datasets and tagging.',models:'ROCm · kohya sd-scripts · vision-model tagging',detail:'An opt-in training service with dataset management and automatic tagging. Training competes for VRAM, so hardware fit and model requirements still matter.'},
 {name:'Llama',icon:'llama',summary:'Run local language models with per-model controls.',models:'GGUF · llama-swap · RDNA-tuned llama.cpp',detail:'Swap inference backends and tune model parameters on your hardware. Rocsy uses an RDNA-tuned llama.cpp build developed on the RX 7900 XTX.'},
 {name:'Agent',icon:'agent',summary:'Turn a brief into coordinated work across studios.',models:'Hermes · studio orchestration · queue priority',detail:'Give the Master Agent a sequence such as song, clips, montage and captions. It plans and drives the studios; its GPU jobs receive queue priority.'},
 {name:'Models',icon:'models',summary:'Download, check hardware fit and manage updates.',models:'Civitai · Hugging Face · shared model library',detail:'Download models and LoRAs into the shared library. Hardware-fit and update checks help you navigate a growing collection without duplicating files across studios.'}
];
const list=document.getElementById('studio-list');
studios.forEach(s=>{
 const el=document.createElement('details');el.className='studio';el.dataset.search=[s.name,s.summary,s.models,s.detail].join(' ').toLowerCase();
 el.innerHTML='<summary><img src="assets/service-'+s.icon+'.svg" alt=""><strong>'+s.name+'</strong><span>'+s.summary+'</span></summary><div class="studio-content"><p>'+s.detail+'</p><p class="model-label">'+s.models+'</p></div>';list.append(el);
});
document.getElementById('studio-search').addEventListener('input',e=>{
 const query=e.target.value.trim().toLowerCase();let count=0;
 list.querySelectorAll('.studio').forEach(el=>{el.hidden=!el.dataset.search.includes(query);if(!el.hidden)count++});
 document.getElementById('no-studios').hidden=count!==0;
});
const initialJobs=[
 {id:1,type:'Video',icon:'vid',name:'Opening shot',model:'MiniMax H3',state:'running',progress:62,elapsed:'03:42',vram:19.6,params:'10 s / 16:9',note:'Generating the opening shot. Other studios wait for the GPU lock.'},
 {id:2,type:'Music',icon:'mus',name:'Soundtrack',model:'YuE2',state:'queued',progress:0,elapsed:'00:00',vram:17.2,params:'120 s / lyrics',note:'Waiting for the active video job to release the GPU.'},
 {id:3,type:'Image',icon:'krea',name:'Cover artwork',model:'Krea 2 Turbo',state:'queued',progress:0,elapsed:'00:00',vram:14.8,params:'4 images / reference',note:'Runs after the soundtrack in this example.'},
 {id:4,type:'Voice',icon:'voice',name:'Narration',model:'Qwen3-TTS',state:'failed',progress:0,elapsed:'00:04',vram:4.2,params:'Reference voice',note:'The reference audio file is missing. Restore the file or choose another reference before retrying.'}
];
let jobs=structuredClone(initialJobs), selected=1;
const $=id=>document.getElementById(id);
function announce(message){$('announcement').textContent=message}
function render(){
 const active=jobs.find(j=>j.state==='running'), waiting=jobs.filter(j=>j.state==='queued');
 $('job-count').textContent=jobs.filter(j=>j.state==='running').length+' running / '+waiting.length+' queued / '+jobs.filter(j=>j.state==='failed').length+' failed';
 $('gpu-state').textContent=active?'● Rendering':'○ Available';$('gpu-state').className=active?'running':'';
 $('gpu-hint').textContent=active?'One active workload':'No GPU jobs running';
 $('vram').innerHTML=active?active.vram.toFixed(1)+' <span>/ 24 GB</span>':'— <span>/ 24 GB</span>';
 $('vram-meter').value=active?active.vram:0;$('elapsed').textContent=active?active.elapsed:'—';
 $('advance').disabled=!active;$('advance').textContent=active?'Complete running job':'GPU available';
 $('jobs').replaceChildren();
 jobs.forEach(job=>{
 const wrapper=document.createElement('div');wrapper.setAttribute('role','listitem');
 const button=document.createElement('button');button.type='button';button.className='job-button';button.setAttribute('aria-pressed',String(job.id===selected));
 const position=job.state==='running'?'▶':job.state==='queued'?String(waiting.indexOf(job)+1):'—';
 button.innerHTML='<span class="job-type"><small>'+position+'</small><img src="assets/service-'+job.icon+'.svg" alt="">'+job.type+'</span><span><span class="job-name">'+job.name+'</span><span class="job-model">'+job.model+'</span></span><span class="job-status" data-state="'+job.state+'">'+({running:'Running',queued:'Queued',failed:'! Failed',completed:'✓ Done'}[job.state])+'</span>'+(job.state==='running'?'<span class="job-progress"><progress max="100" value="'+job.progress+'" aria-label="'+job.name+' progress"></progress>'+job.progress+'%</span>':'');
 button.addEventListener('click',()=>{selected=job.id;render();$('jobs').querySelectorAll('.job-button')[jobs.indexOf(job)].focus({preventScroll:true})});wrapper.append(button);$('jobs').append(wrapper);
 });
 const job=jobs.find(j=>j.id===selected);$('detail-heading').textContent=job.name;
 $('details').innerHTML='<dt>Studio</dt><dd>'+job.type+'</dd><dt>Model</dt><dd>'+job.model+'</dd><dt>Settings</dt><dd>'+job.params+'</dd><dt>Status</dt><dd>'+job.state+'</dd><dt>Elapsed</dt><dd>'+job.elapsed+'</dd>';
 $('diagnostic').replaceChildren();const info=document.createElement('div');
 if(job.state==='failed'){info.className='diagnostic';const title=document.createElement('strong');title.textContent='Reference audio not found';const p=document.createElement('p');p.textContent=job.note;info.append(title,p)}
 else{info.className='detail-note';info.textContent=job.state==='completed'?'Completed in this example. The next queued studio can now claim the GPU.':job.note}
 $('diagnostic').append(info);$('retry').hidden=job.state!=='failed';
}
$('advance').addEventListener('click',()=>{
 const active=jobs.find(j=>j.state==='running');if(!active)return;
 active.state='completed';active.progress=100;const next=jobs.find(j=>j.state==='queued');
 if(next){next.state='running';next.progress=12;next.elapsed='00:08';next.note='The previous job released the GPU; this job is now running.';selected=next.id}
 else selected=active.id;
 render();announce(active.name+' completed.'+(next?' '+next.name+' is now running.':' The GPU is available.'));
});
$('retry').addEventListener('click',()=>{
 const job=jobs.find(j=>j.id===selected);if(job.state!=='failed')return;
 job.state=jobs.some(j=>j.state==='running')?'queued':'running';job.elapsed='00:00';job.progress=0;job.note='The example reference has been restored. Ready to generate narration.';
 render();announce('Example reference restored. Narration '+job.state+'.');
});
$('reset').addEventListener('click',()=>{jobs=structuredClone(initialJobs);selected=1;render();announce('Queue example reset.')});
render();
const navLinks=[...document.querySelectorAll('.sidebar nav a')];
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(a=>{const current=a.hash==='#'+entry.target.id;a.classList.toggle('selected',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}})},{rootMargin:'-125px 0px -55% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(s=>observer.observe(s))}

