var fs = require('fs');
var SRC_HTML = './build/index.html';
var DEST_PATH = './backend/dest/react/views/index.ejs';
var file = fs.readFileSync(SRC_HTML, 'utf8');
var Sftp = require('sftp-upload');

file = file.replace('<meta name="script">', `
	<script type="application/javascript">
      	window.STAKESAPP={"token":"<%=token%>", "sid":"<%=uid%>"}
	</script>
`);

fs.writeFileSync(DEST_PATH, file);

console.log('File written');

console.log('uploading to server');

var options = {
    host:'45.32.159.135',
    username:'csgostakes',
    password: 'Stak3sV!n101',
    path: './backend/dest/',
    remoteDir: '/home/csgostakes/backend/dest/'
  },
  sftp = new Sftp(options);

sftp.on('error', function(err){
  throw err;
})
  .on('uploading', function(pgs){
    console.log('Uploading', pgs.file);
    console.log(pgs.percent+'% completed');
  })
  .on('completed', function(){
    console.log('Upload Completed');
  })
  .upload();