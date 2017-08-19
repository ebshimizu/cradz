# cradz

Cradz is yet another cards against humanity clone, this time written in node.js.

At this time, Cradz supports basically nothing because it's brand new. In fact, here's a list
of things it doesn't do:
* Have a UI
* Let anyone be the host
* Let you use anything except the base set
* Have a lobby

Here's a list of things it does do:
* Attempt to let you play cah on the Chrome command line

Will it do some things eventually? Probably. It's not intended right now to be a service, but it is
meant to let you set up a nice looking version of cah on your own server if you have the
technical know-how to do that.

## Installation
Clone into directory. Go to the `cradz` directory and run `npm install`.
To get semantic ui working, go to the created `semantic` directory and run
`gulp install`.

## Running the Server
`node server.js`

Then open a browser and go to `localhost`. If you are actually trying to run this
project right now, you should look at the `client.js` file to figure out the
available commands.