const fs = require('fs');

// Read data-store.js
const data = fs.readFileSync('js/data-store.js', 'utf8');

// Process index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace('<script src="js/data-store.js"></script>', '<script>\n' + data + '\n</script>');
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('index.html updated. Size:', fs.statSync('index.html').size);

// Process graph_full.html
let graphHtml = fs.readFileSync('graph_full.html', 'utf8');
graphHtml = graphHtml.replace('<script src="js/data-store.js"></script> <!-- Data Source -->', '<script>\n' + data + '\n</script>');
fs.writeFileSync('graph_full.html', graphHtml, 'utf8');
console.log('graph_full.html updated. Size:', fs.statSync('graph_full.html').size);

console.log('Done!');
