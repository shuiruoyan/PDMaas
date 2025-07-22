import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTOC from 'markdown-it-toc-done-right';


export const html = (markdown) => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })
      .use(markdownItAnchor, { permalink: markdownItAnchor.permalink.ariaHidden({}) })
      .use(markdownItTOC, {
        // includeLevel: [1, 2, 3],
        containerClass: 'toc',
        listType: 'ul'
      });

  const markdownContent = `
  [[toc]]
     
  ${markdown}
  `

  const htmlContent = md.render(markdownContent);

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>Markdown TOC Example</title>
      <style>
        * { list-style: none;  box-sizing: border-box;}
        .toc { height: 100%;}
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        h1, h2, h3, h4, h5, h6 { color: #2c3e50; }
        li { white-space:  nowrap }
        a { color: #3498db; text-decoration: none; }
        html , body { width: 100%; height: 100%; margin: 0; padding: 0; }
        .left { display: inline-block; width: 25%; height: 100%; overflow: auto; background: #f9f9f9; border: 1px solid #ddd; padding: 10px }
        .right { display: inline-block; flex-grow: 1; height: 100%; padding: 10px; overflow: auto; }
        #resizer { width: 5px; background: transparent; cursor: ew-resize;}
        #resizer:hover { background: blue; }
      </style>
    </head>
    <body style='display: flex'>
      <span class='left'>${htmlContent.match(/<nav class="toc">[\s\S]*?<\/nav>/)?.[0] || ''}</span>
      <div id="resizer"></div>
      <span class='right'>${htmlContent.replace(/<nav class="toc">[\s\S]*?<\/nav>/, '')}</span>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
            const leftPanel = document.querySelector('.left');
            const rightPanel = document.querySelector('.right');
            const divider = document.getElementById('resizer');
            const container = document.querySelector('body');
            
            let isDragging = false;
            let containerLeft, containerWidth;
            
            divider.addEventListener('mousedown', function(e) {
                isDragging = true;
                containerLeft = container.getBoundingClientRect().left;
                containerWidth = container.offsetWidth;
                document.body.style.cursor = 'col-resize';
                leftPanel.style.userSelect = 'none';
                leftPanel.style.pointerEvents = 'none';
                rightPanel.style.userSelect = 'none';
                rightPanel.style.pointerEvents = 'none';
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                
                const x = e.clientX - containerLeft;
                const percent = Math.min(Math.max((x / containerWidth) * 100, 15), 85);
                
                leftPanel.style.flex = '0 0 ' + percent + '%';
            });
            
            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.cursor = '';
                    leftPanel.style.userSelect = '';
                    leftPanel.style.pointerEvents = '';
                    rightPanel.style.userSelect = '';
                    rightPanel.style.pointerEvents = '';
                    
                    leftPanel.style.transition = 'flex 0.3s ease';
                    setTimeout(() => { leftPanel.style.transition = ''; }, 300);
                }
            });
        });  
      </script>
    </body>
    </html>
  `;

  return fullHtml;
}
