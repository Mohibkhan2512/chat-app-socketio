socket = io();

let myMsg = "Thanks for welcoming";
//  the event name must be same as the one used during emit
socket.on("message", (msg) => {
  console.log(msg);

  // socket.emit('message', myMsg)
});

// Elements
const $mesageForm = document.querySelector("#message-form")
const $mesageFormInput = $mesageForm.querySelector("input")
const $mesageFormButton = $mesageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#share-location")
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

$mesageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $mesageFormButton.setAttribute('disabled', 'disabled')

  // read input field value
  let message = e.target.elements.message.value;

  // console.log(message)

  socket.emit("sendMessage", message, (error) => {
    $mesageFormButton.removeAttribute('disabled')
    $mesageFormInput.value = ''
    $mesageFormInput.focus()

    if (error) {
      console.log("Message was not delivered!", error);
    } else {
      console.log("Message was delivered!");
    }
  });
});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    // console.log("msg", message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    // console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        // url
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$sendLocationButton.addEventListener("click", () => {
  $sendLocationButton.setAttribute('disabled', 'disabled')
  if (!navigator.geolocation) {
    return alert("Support not available");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position)
    
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute('disabled')
        console.log("Location shared!")
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
