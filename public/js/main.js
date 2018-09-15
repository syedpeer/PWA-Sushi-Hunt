if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function (registration) {
    console.log('ServiceWorker registration successful with scope: ', registration.scope)
  }).catch(function (err) {
    console.log('ServiceWorker registration failed: ', err);
  })
}

if (navigator.geolocation) {
  console.log('Geolocation is supported!');
} else {
  console.log('Geolocation is not supported for this Browser/OS version yet.');
}

const get = (url) => {
  console.log("get url");
  return new Promise(function (resolve, reject) {
    var req = new XMLHttpRequest();

    req.open('GET', url);
    req.onload = function () {
      if (req.status == 200) {
        resolve(req.response);
      }
      else {
        reject(Error(req.statusText));
      }
    };

    req.onerror = function () {
      reject(Error("Network Error"));
    }
    req.send();
  })
}

// templates 
const header = (store) => {
  let str = store.coords.lat && store.coords.long
    ? `${store.coords.lat}, ${store.coords.long}`
    : (store.error && store.error !== 2)
      ? `Bad news! We cannot find you`
      : `Tap 'Detect' to find sushi nearby`

  return (
    `<div class="header">
      <div class="block container">
        <h4 class="h4 center">Sushi Hunt</h4>
        <h4 id="location" class="h4 placeholder">
          <span id="latlong">${str}</span>
        </h4>
        <button id="submit">Detect<img src="images/detect.svg"></button>
      </div>
    </div>`)
}

const loader = () => (
  `<div id="loader" class="loadSpin">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
       width="40px" height="40px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
      <path fill="#8a8a8a" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
      </path>
    </svg>
  </div>`
)

const empty = () => (
  `<div id="empty" class="fadeIn">
    <img src="images/empty.svg">
    <h1 class="h2">Got a sushi craving?<h1>
    <h4 class="h4">Find the best sushi restaurants<br> in your neighborhood</h4>
  </div>`
)

const noLocation = (error) => (
  `<div id="no-location" class="fadeIn">
    <img src="images/no-location.svg">
    <h1 class="h2">Can't find your location<h1>
    <h4 id="location-error" class="h4">${error}</h4>
  </div>`
)

const results = (store) => {
  if (store.loader) {
    return loader()
  } else if (store.error === 1) {
    return noLocation(`Are you sure your location <br> service is switched on?`)
  } else if (store.error === 3) {
    return noLocation(`Are you moving? Hold still, <br> so we can find you!`)
  } else if (store.results) {
    return store.results
  } else {
    return empty()
  }
}

const template = (state) => (
  `${header(state)}
    <div id="results" class="container">
      ${results(state)}
    </div>
  `
)

// application 

const app = new App('#app')
const router = new Router(app)

const store = (app) => ({
  state: {
    coords: {},
    results: null,
    error: false,
    loader: false,
  },
  setState(obj) {
    this.state = { ...this.state, ...obj }
    app.updateView()
  },
  getLocation() {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 0, timeout: 10000 })
    })
  },
  getResults(url) {
    return new Promise(function (resolve, reject) {
      const req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = function () {
        if (req.status == 200) {
          resolve(req.response);
        } else {
          reject(Error(req.statusText));
        }
      }
      req.onerror = function () {
        reject(Error("Network Error"));
      }
      req.send();
    })
  }
})

app.addComponent({
  name: 'default',
  template,
  store: store(app),
  init(store) {
    const button = document.getElementById('submit')
    button.addEventListener('click', async () => {
      try {
        const position = await store.getLocation()
        const coords = { lat: position.coords.latitude, long: position.coords.longitude }
        store.setState({ coords, loader: true })
        try {
          const results = await store.getResults(`/results/?lat=${coords.lat}&long=${coords.long}`)
          store.setState({ results, loader: false })
        } catch(e) {
          store.setState({ error: e })
        }
      } catch(e) {
        store.setState({ error: e.code })
      }
    })
  }
})

router.addRoute('default', '^#/$')





