var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//user数据
var data = [];

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html')
});
app.get('/api/checkName',function (req, res) {
	var name = req.query.name;
	var message = '';
	var status = 0;
	if(name == ''){
		status =0;
		message = '昵称不能为空'
	}else if(!checkName(name)){
		status =0;
		message = '昵称已被占用，换个新昵称吧'
	}else{
		status = 1;
		message = '昵称校验通过'
	}
	res.status(200).send({status:status,message:message})
});

function checkName(name) {
	for (var i = 0; i < data.length; i++) {
		if (data[i].name == name) {
			return false;
		}
	}
	return true;
}
io.on('connection', function (socket) {
//离开
	socket.on('disconnect', function () {
		for (var i = 0; i < data.length; i++) {
			if (data[i].id == socket.id) {
				io.emit('user exit', data[i].name + ' 离开了聊天室');
				data.splice(i, 1);
			}
		}
		var users = [];
		for (var i = 0; i < data.length; i++) {
			users.push(data[i]['name']);
		}
		io.emit('users', users.join(';'));
	});
//发消息
	socket.on('chat message', function (msg) {
		var name = '';
		for (var i = 0; i < data.length; i++) {
			if (data[i].id == socket.id) {
				name = data[i].name
			}
		}
		socket.broadcast.emit('chat message', name + ': ' + msg);
	});
//设置昵称
	socket.on('set name', function (name) {
		data.push({id: socket.id, name: name});
		io.emit('user join', name + ' 加入了聊天');
		var users = [];
		for (var i = 0; i < data.length; i++) {
			users.push(data[i]['name']);
		}
		io.emit('users', users.join(';'));
	});
//正在输入
	socket.on('typing', function () {
		for (var i = 0; i < data.length; i++) {
			if (data[i].id == socket.id) {
				socket.broadcast.emit('show typing', '"' + data[i].name + '"正在输入');
			}
		}
	})
});

http.listen(3000, function () {
	console.log('listening on *:3000')
});