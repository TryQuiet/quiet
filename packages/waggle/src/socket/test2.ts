var socket = require('socket.io-client')('http://localhost:4000')
socket.on('connect', function(){
  console.log('test')
})
socket.on('message', function(data){
  console.log('dupa', data)
})
socket.on('disconnect', function(){
  console.log('disconected')
})
