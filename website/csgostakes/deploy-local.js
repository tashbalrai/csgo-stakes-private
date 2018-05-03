var fs = require('fs');
var SRC_HTML = './build/index.html';
var DEST_PATH = './backend/es6/react/views/index.ejs';
var file = fs.readFileSync(SRC_HTML, 'utf8');
var Sftp = require('sftp-upload');

file = file.replace('<meta name="script">', `
	<script type="application/javascript">
      	window.STAKESAPP={"token":"<%=token%>", "sid":"<%=uid%>"}
	</script>
`);

fs.writeFileSync(DEST_PATH, file);

console.log('File written');