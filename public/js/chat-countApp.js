socket = io()

//  the event name must be same as the one used during emit
socket.on('countUpdated', (count) => {
    console.log("Count updated => ", count)
})

document.querySelector("#increment").addEventListener('click', () => {
    console.log("Btn Clicked")

    socket.emit("increment")
})