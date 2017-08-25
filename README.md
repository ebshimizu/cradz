# cradz

Cradz is yet another cards against humanity clone, this time written in node.js.

Here's a list of things it does do:
* Let you play a single instance of cards against humanity on a server of your choice.

Here's what it doesn't do right now:
* Let anyone be the host
* Have a lobby (you can't run this as a service very easily)

## Installation
Clone into directory. Go to the `cradz` directory and run `npm install`.
To get semantic ui working, go to the created `semantic` directory and run
`gulp install`.

## Running the Server
`node server.js`

Then open a browser and go to `localhost`.

### Third-Party Libraries
* Card lists from JSON Against Humanity: https://www.crhallberg.com/cah/json/
* Uses isotope.js: https://isotope.metafizzy.co/
* Uses Semantic UI: http://semantic-ui.com/