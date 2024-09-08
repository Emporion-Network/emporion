# Momorepo containing all code related to emporion.network
To run the app in dev mode you need
 - Rust
 - Go
 - Docker
 - Bun

Follow the instructions of [neutron](https://docs.neutron.org/neutron/build-and-run/cosmopark) to get the chain up and running.

Once your chain is up you can deploy the Emporion contracts by running 
`bun run scripts/deploy.ts` in the root directory. This will build the wasm contracts and update the env files with the new addresses. Make sure `NODE_ENV` is set to `development` in order for the script to update the right `.env` files.

> **_NOTE:_** Currently there is a bug in the generation of the typescript client that does not affect the runtime but might prevent good typechecking a manual update to the file `client-ts/Emporion.client.ts` is needed in order to get full typechecking

You can then start the dev server by running `npm run dev` in the `backend` folder.

> **_NOTE:_** The backend server uses a object sorage to percist data you will have to provide a credentials to a S3 compatible object storage in a .env file in the folder `backend` the file should look like this:

```env
STORAGE_SECRET=****
STORAGE_KEY=****
BUKET_ENDPOINT=https://example.com
BUKET_REGION="nyc"
STORAGE_BUKET=the buket name
```

Once the server is running you can start the frontend by running `npm run dev` in the `dapp` folder



## Things to consider
- [ ] updating price of a product in case an order is beeing created with the older price



## TODO

- [ ] Contract
    - [x] add withraw dev to address
    - [x] add expiration to orders
- [x] integration tests
    - [x] product creation tests
    - [x] user tests
    - [x] order tests
    - [x] bank tests
    - [x] params tests
    - [x] review tests
    - [x] distribution tests
- [ ] Front
    - [x] deploy the dao
    - [x] add metadata server
    - [x] proxy the prices
    - [x] add navigation
    - [x] add gallery images
    - [x] update color to have a label
    - [x] filter inactive 
    - [x] add products page
    - [x] add search
    - [x] add cart
    - [x] add is active
    - [x] add tooltips all over
    - [x] add query blacklist
    - [x] create order
    - [x] select attribute
    - [x] filter blacklisted
    - [x] refactor api
    - [x] add delivery address
    - [x] add filters
    - [x] add investment page
    - [ ] add reviews to product page and account page
    - [ ] create chat
    - [ ] add loaders
    - [ ] make everything phone friendly
    - [ ] Finish home page
    - [ ] location attribute
    - [ ] add stats page
    - [ ] add user page with orders stats and reviews
    - [ ] add home page
    - [ ] add gidelines page
- [x] Write deployement scripts
- [ ] Write docs