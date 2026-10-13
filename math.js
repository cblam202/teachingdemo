"use strict";

// 1. Typeset the saved LaTeX equations with the locally hosted KaTeX library.
// Keep the native MathML as a fallback if the library cannot load.
if (typeof katex!=="undefined") {
  document.querySelectorAll('.methodology .formula').forEach(element=>{
    const source=element.querySelector('annotation[encoding="application/x-tex"]');
    if (!source) return;
    element.innerHTML=katex.renderToString(source.textContent,{
      displayMode:true,
      output:"htmlAndMathml",
      throwOnError:true,
      trust:false
    });
  });
}
