"use strict";

// 1. A small, optional chat panel. No model or remote resource loads on page entry.
(() => {
  const base=new URL(".",document.currentScript.src),root=document.createElement("div");
  root.className="demo-chat";
  root.innerHTML=`
    <div class="chat-invitation" id="chat-invitation">
      <button type="button" id="chat-invite">Ask me a question</button>
      <button type="button" id="chat-dismiss" aria-label="Dismiss invitation">×</button>
    </div>
    <button type="button" class="chat-launcher" id="chat-launcher" aria-label="Open statistics assistant" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/></svg>
    </button>
    <div class="chat-panel" id="chat-panel" role="dialog" aria-labelledby="chat-title" hidden>
      <div class="chat-header"><div><h2 id="chat-title">Statistics assistant</h2><span>Ask about this demo</span></div><button type="button" id="chat-close" aria-label="Close chat">×</button></div>
      <div class="chat-body">
        <div class="chat-setup" id="chat-setup">
          <p>Hi! Ask me about the tests or your current results.</p>
          <div class="chat-privacy-notice" id="chat-download-note">
            <p>Starting the assistant downloads about 1 GB of model files to run it in your browser. These files can be cached for later visits.</p>
            <p>Your questions, results, and replies are processed on this device and are not sent to any AI service or uploaded to any server.</p>
            <details class="chat-privacy-details"><summary>Data and Privacy. Please read!</summary>
            <p><strong>Runs in your browser.</strong> This assistant runs within your browser using your device’s computing resources. It uses your question and the current test results to explain the demo. Pasted observations stay in the demo; the assistant receives them only if you include them in a question.</p>
            <p><strong>About 1 GB to download.</strong> When you click “Start assistant,” your browser will download about 1 GB of model files. The first download may take several minutes and uses your internet connection’s data allowance. A compatible browser and sufficient device memory and storage are required.</p>
            <p><strong>Model files are cached; conversations are not saved.</strong> Your browser caches the model files for later visits when storage allows. A different device or browser, cleared storage, or automatic removal by the browser may require another download. This website does not save your questions or replies to browser storage or a server.</p>
            <p><strong>Your conversation lasts for this page session.</strong> Leaving this page or selecting “End chat and free memory” clears the conversation from the assistant. Closing the chat panel only hides it. Ending the chat does not delete the cached model files.</p>
            <p><strong>Downloads still make internet connections.</strong> GitHub serves the website, and Hugging Face and its download providers deliver the model files. These services receive ordinary connection information, such as your IP address and the files requested, but not your questions, results, or replies.</p>
            <p><strong>Using a public or shared device?</strong> Please consider its privacy and security settings before proceeding. This website cannot control browser extensions, device monitoring, or access by other people using the same computer or browser account. End the chat and close the page when you are finished.</p>
            </details>
          </div>
          <button class="chat-primary" type="button" id="chat-start">Start assistant</button>
          <progress id="chat-progress" max="1" value="0" aria-label="Loading assistant" hidden></progress>
        </div>
        <div class="chat-status" id="chat-status" role="status" aria-live="polite"></div>
        <div class="chat-log" id="chat-log" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text"></div>
      </div>
      <form class="chat-form" id="chat-form">
        <label class="sr-only" for="chat-question">Your question</label>
        <textarea id="chat-question" rows="2" maxlength="600" placeholder="Ask a question…" aria-describedby="chat-caution" disabled></textarea>
        <div class="chat-actions"><button type="button" id="chat-clear" class="quiet" disabled>New chat</button><button type="button" id="chat-stop" class="quiet" hidden>Stop</button><button type="submit" id="chat-send" class="chat-primary" disabled>Send</button></div>
      </form>
      <div class="chat-footer">
        <p id="chat-caution">AI can make mistakes. Check explanations against the demo and course materials.</p>
        <details><summary>About this assistant</summary>
          <p>Responses are generated in your browser using SmolLM2 and WebLLM under the <a href="vendor/webllm/LICENSE.txt">Apache 2.0 License</a>. A compatible device is required.</p>
          <p>The assistant uses your question and the current result summaries locally. It does not receive the pasted observations unless you include them in a question. This site does not upload or save the conversation; it clears when you leave the page or end the chat.</p>
          <p>GitHub serves the website, and Hugging Face and its download providers deliver the model files. These services receive ordinary connection information, such as your IP address and requested files, but not your conversation. Browser extensions and device monitoring are outside this site's control.</p>
          <div class="reference-list">
            <p>Hugging Face. (n.d.). <i>SmolLM2-1.7B-Instruct</i> [Language model]. <a href="https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct" target="_blank" rel="noopener noreferrer">Model card</a>. <a href="https://huggingface.co/mlc-ai/SmolLM2-1.7B-Instruct-q4f16_1-MLC" target="_blank" rel="noopener noreferrer">MLC AI adaptation</a>.</p>
            <p>MLC AI. (n.d.). <i>WebLLM</i> (Version 0.2.86) [Computer software]. <a href="https://github.com/mlc-ai/web-llm" target="_blank" rel="noopener noreferrer">Source</a>. <a href="vendor/webllm/THIRD-PARTY-NOTICES.txt">Additional credits</a>.</p>
          </div>
        </details>
        <button type="button" id="chat-end" class="chat-end" hidden>End chat and free memory</button>
      </div>
    </div>`;
  document.body.append(root);
  const $=id=>document.getElementById(id);
  let worker=null,state="idle",sequence=0,requestId=0,history=[],fingerprint="",answerNode=null,pendingQuestion="",watchdog=null;
  try {$("chat-invitation").hidden=sessionStorage.getItem("demo-chat-invited")==="yes";} catch(error) { /* Storage may be disabled. */ }
  function dismiss() {
    $("chat-invitation").hidden=true;
    try {sessionStorage.setItem("demo-chat-invited","yes");} catch(error) { /* Invitation still dismisses for this page. */ }
  }
  function open() {
    dismiss();$("chat-panel").hidden=false;$("chat-launcher").setAttribute("aria-expanded","true");
    (state==="ready"?$("chat-question"):$("chat-close")).focus();
  }
  function close() {$("chat-panel").hidden=true;$("chat-launcher").setAttribute("aria-expanded","false");$("chat-launcher").focus();}
  function status(text) {$("chat-status").textContent=text;}
  function controls(next) {
    state=next;
    $("chat-setup").hidden=next==="ready"||next==="generating";
    $("chat-start").disabled=next==="loading"||next==="unsupported";
    $("chat-progress").hidden=next!=="loading";
    $("chat-question").disabled=next!=="ready";
    $("chat-send").disabled=next!=="ready";
    $("chat-clear").disabled=next!=="ready";
    $("chat-stop").hidden=next!=="loading"&&next!=="generating";
    $("chat-stop").disabled=false;
    $("chat-end").hidden=!worker;
  }
  function message(role,text) {
    const item=document.createElement("div"),label=document.createElement("strong"),body=document.createElement("p");
    item.className="chat-message chat-"+role;
    label.textContent=role==="user"?"You":"Assistant";body.textContent=text;
    item.append(label,body);$("chat-log").append(item);
    // Cap the visible transcript as well as model history for long sessions.
    while ($("chat-log").children.length>24) $("chat-log").firstElementChild.remove();
    scroll();return body;
  }
  function scroll() {const body=root.querySelector(".chat-body");body.scrollTop=body.scrollHeight;}
  function release() {
    clearTimeout(watchdog);requestId=++sequence;
    if (worker) worker.terminate();
    worker=null;
  }
  function failed(text) {
    release();
    if (answerNode) {
      answerNode.textContent="The response was interrupted. Please try again.";
      answerNode.parentElement.setAttribute("aria-busy","false");
    }
    answerNode=null;history=[];pendingQuestion="";
    $("chat-start").textContent="Try again";controls("error");status(text);
  }
  function watch() {
    clearTimeout(watchdog);
    watchdog=setTimeout(()=>failed("The assistant stopped responding. You can try again; the demo still works."),180000);
  }
  function context() {
    return typeof globalThis.readTeachingDemo==="function"?globalThis.readTeachingDemo():{page:"home",valid:false};
  }

  // 2. Load only after an explicit click. Terminating the worker also cancels a download.
  async function start() {
    if (state==="loading"||state==="ready"||state==="generating") return;
    controls("loading");status("Checking this device…");$("chat-progress").value=0;
    const attempt=++sequence;requestId=attempt;
    if (!globalThis.isSecureContext || location.protocol==="file:") {
      controls("unsupported");status("The assistant needs the published HTTPS website. The demos still work when opened as local files.");return;
    }
    if (!navigator.gpu || typeof Worker==="undefined") {
      controls("unsupported");status("This browser cannot run the assistant. Try a browser and device with WebGPU support; the demos still work here.");return;
    }
    try {
      watch();
      const adapter=await navigator.gpu.requestAdapter();
      if (requestId!==attempt) return;
      if (!adapter || !adapter.features.has("shader-f16")) {
        clearTimeout(watchdog);controls("unsupported");status("This device does not support this model. You can still use all the demos and their Methodology sections.");return;
      }
      worker=new Worker(new URL("chat-worker.js",base),{type:"module"});
      const activeWorker=worker;
      worker.onmessage=receive;
      worker.onerror=()=>{if (worker===activeWorker) failed("The assistant could not run. Check your connection and available memory, then try again.");};
      worker.onmessageerror=()=>{if (worker===activeWorker) failed("The assistant connection was interrupted. Please try again.");};
      controls("loading");status("Loading the assistant. The first download is about 1 GB…");
      worker.postMessage({type:"load",id:requestId});
    } catch(error) {
      if (requestId===attempt) failed("The assistant could not start on this device. You can still use the demos.");
    }
  }
  function receive(event) {
    const data=event.data;
    if (data.id!==requestId) return;
    watch();
    if (data.type==="progress") {
      $("chat-progress").value=Math.max(0,Math.min(1,Number(data.progress)||0));
      status("Loading assistant: "+Math.round($("chat-progress").value*100)+"%. This may take a few minutes.");
    } else if (data.type==="ready") {
      clearTimeout(watchdog);controls("ready");status("Ready. Ask about the demo or your results.");
      if (!$("chat-panel").hidden) $("chat-question").focus();
    } else if (data.type==="token") {
      if (answerNode) answerNode.textContent=data.text||"Thinking…";
      scroll();
    } else if (data.type==="done") {
      clearTimeout(watchdog);
      if (answerNode) {
        answerNode.textContent=data.text||(data.stopped?"Response stopped.":"I could not produce an answer. Please try a shorter question.");
        answerNode.parentElement.setAttribute("aria-busy","false");
      }
      history=data.text&&!data.stopped?[{role:"user",content:pendingQuestion},{role:"assistant",content:data.text}]:[];
      pendingQuestion="";
      answerNode=null;controls("ready");
      status(data.stopped?"Response stopped.":data.truncated?"Reply length reached. Ask a follow-up to continue.":"Answers use the results when you press Send.");
      if (!$("chat-panel").hidden) $("chat-question").focus();
      scroll();
    } else if (data.type==="error") {
      failed(data.phase==="load"?"The download or model setup failed. Check your connection and available storage, then try again.":"The assistant could not finish. Try again with a shorter question or start a new chat.");
    }
  }

  // 3. Each question uses a fresh snapshot. Display all generated content as plain text.
  function send(event) {
    event.preventDefault();
    const question=$("chat-question").value.trim().slice(0,600);
    if (state!=="ready" || !question) return;
    const current=context(),key=DemoChatContext.snapshot(current);
    if (fingerprint && fingerprint!==key) {
      history=[];
      message("assistant","The test settings or results changed. I’ll use the current results for this question.");
    }
    fingerprint=key;pendingQuestion=question;
    message("user",question);answerNode=message("assistant","Thinking…");
    answerNode.parentElement.setAttribute("aria-busy","true");
    $("chat-question").value="";controls("generating");status("Preparing an explanation…");watch();
    requestId=++sequence;
    worker.postMessage({type:"generate",id:requestId,messages:DemoChatContext.messages(current,question,history)});
  }
  function stop() {
    if (state==="loading") {release();controls("idle");status("Loading stopped. You can start again when you’re ready.");}
    else if (state==="generating") {worker.postMessage({type:"stop",id:requestId});$("chat-stop").disabled=true;status("Stopping…");}
  }
  function clear() {history=[];fingerprint="";pendingQuestion="";$("chat-log").replaceChildren();$("chat-question").value="";status("New chat. Ask about the current demo.");$("chat-question").focus();}
  function end() {
    release();history=[];fingerprint="";pendingQuestion="";answerNode=null;$("chat-log").replaceChildren();$("chat-question").value="";
    $("chat-start").textContent="Start assistant";controls("idle");status("Chat ended. Downloaded model files remain cached for later use.");
  }
  $("chat-invite").addEventListener("click",open);
  $("chat-dismiss").addEventListener("click",dismiss);
  $("chat-launcher").addEventListener("click",()=>$("chat-panel").hidden?open():close());
  $("chat-close").addEventListener("click",close);
  $("chat-panel").addEventListener("keydown",event=>{if (event.key==="Escape") {event.preventDefault();close();}});
  $("chat-start").addEventListener("click",start);
  $("chat-form").addEventListener("submit",send);
  $("chat-question").addEventListener("keydown",event=>{if (event.key==="Enter"&&!event.shiftKey&&!event.isComposing) send(event);});
  $("chat-stop").addEventListener("click",stop);
  $("chat-clear").addEventListener("click",clear);
  $("chat-end").addEventListener("click",end);
  globalThis.addEventListener("pagehide",end);
})();
