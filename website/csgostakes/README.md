# csgostakes

The frontend is in the root folder.

The backend is in the backend folder.

The frontend server proxies requests to the backend server. Look in package.json "proxy" section.

## frontend

Uses yarn because I like it.

initial frontend setup:
```
cd csgostakes
yarn install
yarn start
```

frontend runs on port 4000, this can be customised in the ".env" file.

misc notes

- frontend
    - uses https://github.com/facebookincubator/create-react-app
    - requires:
        - node 6 or newer
        - yarn

(frontend mostly written by Chris - aka thirtydot)

## backend

Uses npm (as opposed to yarn).

Run `npm install` in the backend folder.

Each folder have gulpfile.js inside es6 folder and outside there is gulpfile.js.

In the root directory of the branch enter the following command to transpile the code:

```
gulp base
```

This will create a "dest" folder with all files and folders transpiled inside it.

You need to do it once only. After that you can go into the specific folder and write `gulp` command. It will transpile only that folder contents and will watch for new changes. so if you have to work in the folder you can keep that console window open in which you have run the gulp command.

Then under the "dest" folder run `node index` to start the application.

Or you can use forever or anything else to re-run the application after each change is done to the code.

```
forever -w ./ index.js
```

You will also likely have to change some stuff in `backend/dest/config.js` to match your local environment.

A redis server is required.

A mysql server is either required now, or will be in the future.

**Environment configuration**

NODE_DEV_MODE environment variable decide which configuration file to load.

```config-<name>.js``` <name> is the value assigned in the NODE_DEV_MODE env variable e.g. NODE_DEV_MODE="vince" will try to load the config file config-vince.js otherwise it will default to config-test.js if NODE_DEV_MODE is set. If NODE_DEV_MODE is undefined then it will default to config-prod.js

(backend mostly written by Vince/Ryan)

## deploy
```
npm run deploy
```
First run might throw error. Then run again.
check deploy.js for server config
