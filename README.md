# nest

## Introduction

Nest is my Bachelor project at [HEIG-VD](http://www.heig-vd.ch). It was developed to provide an Analytics Tool focused on measuring followers activity and engagement for the Radio Télévision Suisse (RTS) - public service TV and Radio broadcast company.

This web application runs on [AngularJS](https://angularjs.org) and renders the data visualization through the  [D3](http://d3js.org) library. The Venn diagram rendering is courtesy of [Benfred's venn.js plugin](https://github.com/benfred/venn.js).

<!-- The app is up and running at this address: [https://nest.herokuapp.com](https://nest.herokuapp.com). -->

## Requirements to run on localhost

We assume you have already installed [Node and npm](https://nodejs.org).

* Install `grunt-cli` and `bower`:
```
$ npm install -g grunt-cli bower
```
* Follow this quick install guide to get [OAuthd](https://github.com/oauth-io/oauthd) up and running (Will guide you through installing Redis) : https://github.com/oauth-io/oauthd/wiki/Quickstart
* Go to the Twitter Developers page and create an App (you'll need its token for OAuth)
![](/screenshots/TwitterApp.png)
* When your Redis server and OAutd are running, head to localhost:6284 and log in the admin panel
* Setup the Twitter App
![](http://blog.oauth.io/wp-content/uploads/2013/12/twitter-setup2.gif)

## Installation

* Clone this repo.
```
$ git clone git@github.com:quentindelattre/nest.git
```
* `cd` to the cloned directory and install the packages.
```
$ npm install && bower install
```
* Run the app.
```
$ grunt serve
```
* Open a browser on [localhost:9000](localhost:9000).

## Usage

### Homepage

The home page lets you login with Twitter. Login with the account that you want to analyze and authorize the Nest App (read only).
![](/screenshots/00_LandingPage.png)

### Loading Page

Nest collects three different data to provide the analytics :
* The 3200 latest tweets from your own timeline (3200 is the API limit).
* The 800 latest tweets mentioning your @handle.
* The list of all your followers including (if any) the date of their latest tweet. This takes very long if you have a lot of followers because of [Twitter's rate limit](https://dev.twitter.com/rest/public/rate-limiting) on the API requests. The script collects 3000 followers per 15-minute session, then waits for a new session and continues, so sit back and relax, it's not broken it just takes a while.

![](/screenshots/01_Loading.jpg)

### Nest Page

![](/screenshots/02_Render.jpg)

The visualization page shows you the data in an interactive way. On the left sidebar, you get numerical statistics about your followers activity and engagement with your account and the latest tweet from your account. On the top of the page, you can see the Time Machine that lets you visualize the evolution of your stats over time. The main part of the view is occupied by the interactive charts. The intersecting circles represent the statistics in the left sidebar while the bar chart shows the retweets and favorites your tweets generated during the time period set in the Time Machine. Finally, the right sidebar presents the most frequent hashtags used in your tweets in the last days set in the Time Machine. Let's walk through the stats and functionalities available in the app.

#### Time Machine
![](/screenshots/03_TimeMachine.jpg)

Adjust the time period of the stats with the slider.

#### Sidebar
![](/screenshots/05_HoverStats.jpg)

##### Active followers
A follower is considered active if he has tweeted within the time span of the Time Machine.
The hover indications present details about the "health" of your followers. For example, if a follower has a pristine default account and follows way more people than is followed by (following 10'000 accounts and is followed by 20), it is likely to be a bot or spam account. The users that have at least tweeted once (even out of the Time Machine limit) are considered as Standard users. Finally, there is the number of verified accounts of official users.

##### Engaged followers
The engaged followers are those who have retweeted your tweets and/or added them to their favorites and/or mentioned your @handle.

#### Visualization
The Venn diagram adjust with the Time Machine, on hover, the value of the circle is displayed in a tooltip.

The bar chart represents the daily amount of retweets and mentions over the whole Time Machine. You can therefore see when your account was especially successful with your community. When a specific spike intrigues you, click on it and all your tweets from that day show up with the most successful first.

![](/screenshots/07_TweetsFromDay.jpg)


##### Hashtags

![](/screenshots/06_MoreHashtags.jpg)

By default, the 20 most frequent hashtags are displayed, you can show more or less of them and click to go directly on Twitter and see other tweets with these hashtags.




# Copyright & License

Copyright © 2015 Quentin de Lattre (Bachelor Project at  [HEIG-VD](http://www.heig-vd.ch))

Licensed under the MIT License.
