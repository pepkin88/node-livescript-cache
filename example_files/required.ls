# This file will be compiled to .ls/example.js
for let i from 1 to 3
	setTimeout _, i * 200ms <| ->
		console.log "hello, #i"
