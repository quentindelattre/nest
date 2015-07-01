# nest

### Introduction

Nest is my Bachelor project at [HEIG-VD](http://www.heig-vd.ch). It was developed to provide an Analytics Tool focused on measuring followers activit and engagement for the Radio Télévision Suisse (RTS) - public service TV and Radio broadcast company.

This web application runs on [AngularJS](https://angularjs.org) and renders the data visualization through the  [D3](http://d3js.org) library. The Venn diagram rendering is courtesy of [Benfred's venn.js plugin](https://github.com/benfred/venn.js).

<!-- The app is up and running at this address: [https://nest.herokuapp.com](https://nest.herokuapp.com). -->

### Requirements to run ono localhost

We assume you have already installed [Node and npm](https://nodejs.org).

* Install `grunt-cli` and `bower`:
```
$ npm install -g grunt-cli bower
```
* Follow this quick install guide to get OAuthd up and running (Will guide you through installing Redis) : https://github.com/oauth-io/oauthd/wiki/Quickstart

### Installation

* Clone this repo
```
$ git clone git@github.com:quentindelattre/nest.git
```
* `cd` to the cloned directory and install the packages
```
$ npm install && bower install
```
* Run the app
```
$ grunt serve
```
* Open a browser on [localhost:9000](localhost:9000)

### Usage

##### Homepage

The home page lets you login with Twitter. Login with the account that you want to analyze and authorize the Nest App (read only).
![](/screenshots/00_LandingPage.png)

##### Loading Page

Nest collects three different data to provide the analytics :
* The 3200 latest tweets from your own timeline (3200 is the API limit).
* The 800 latest tweets mentioning your @handle
* The list of all your followers including (if any) the date of their latest tweet. This takes very long if you have a lot of followers because of [Twitter's rate limit](https://dev.twitter.com/rest/public/rate-limiting) on the API requests. The script collects 3000 followers per 15-minute session, then waits for a new session and continues, so sit back and relax, it's not broken it just takes a while.

![](/screenshots/01_Loading.jpg)

##### Nest Page

![](/screenshots/02_Render.jpg)

The visualization page shows you the data in an interactive way. On the left sidebar, you get numerical statistics about your followers activity and engagement with your account.



### Copyright & License

Copyright © 2015 Quentin de Lattre (Bachelor Project at  [HEIG-VD](http://www.heig-vd.ch))

Licensed under the MIT License.
