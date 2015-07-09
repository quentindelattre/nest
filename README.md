# nest

## Introduction

Nest is my Bachelor project at [HEIG-VD](http://www.heig-vd.ch). It was developed to provide an Analytics Tool focused on measuring followers activity and engagement for the Radio Télévision Suisse (RTS) - public service TV and Radio broadcast company over its multiple Twitter accounts.

This web application runs on [AngularJS](https://angularjs.org) and renders the data visualization through the  [D3](http://d3js.org) library. The Venn diagram rendering is courtesy of [Benfred's venn.js plugin](https://github.com/benfred/venn.js).

The app is up and running at this address: [http://nest.herokuapp.com](http://nest.herokuapp.com).

### Engagement
What is engagement ? This notion is quite complex to define since it relies on many types of behaviour from a user towards another. The official definition from Twitter describes engagement as any action going further than just seeing a tweet from a user in one's timeline. That entails:
* Clicks on your tweet (on the profile picture, the possible embedded media, or the tweet itself to see the details)
* Retweeting your tweet
* Adding your tweet to their favorites
* Replying to your tweet
* Starting to follow the user who sent the tweet

However, some [other reference website](http://simplymeasured.com/blog/2013/06/05/twitter-metrics-defined-engagement/#i.11ldj2m1cc4ecf) consider engagement simply as the sum of retweets, favorites and mentions over a certain time span. Eventually, this notion has to be tailored to what you are trying to analyse. In the case of this project, we consider engagement as the latter (ie. Retweets + Favorites + Mentions).

## Requirements to run on localhost

We assume you have already installed [Node and npm](https://nodejs.org).

* Install `grunt-cli` and `bower`:
```
$ npm install -g grunt-cli bower
```
* Follow this quick install guide to get [OAuthd](https://github.com/oauth-io/oauthd) up and running (Will guide you through installing Redis) : https://github.com/oauth-io/oauthd/wiki/Quickstart
* When your Redis server and OAutd are running, you can use the app.

## Installation

* Clone this repo.
```
$ git clone git@github.com:quentindelattre/nest.git
```
* `cd` to the cloned directory and install the packages. (You might have to `sudo` these commands individually)
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

The home page lets you login with Twitter. Login with the account that you want to analyze and authorize the Nest App.
![](/screenshots/00_LandingPage.png)

### Loading Page

Nest collects three different data to provide the analytics :
* The 3200 latest tweets from your own timeline. (3200 is the API limit)
* The 800 latest tweets mentioning your @handle. (Also limited by the API to 800)
* The list of all your followers including (if any) the date of their latest tweet. This takes very long if you have a lot of followers because of [Twitter's rate limit](https://dev.twitter.com/rest/public/rate-limiting) on the API requests. The script collects 3000 followers per 15-minute session, then waits for a new session and continues, so sit back and relax, it's not broken it just takes a while.

![](/screenshots/01_Loading.jpg)

### Nest Page

![](/screenshots/02_Render.jpg)

On the left sidebar of the visualization page, you have numerical statistics about your followers activity and engagement with your account and the latest tweet from your timeline. On the top of the page, you can see the Time Machine that lets you visualize the evolution of your stats over time. The main part of the view is occupied by the interactive charts. The bar chart shows you how many retweets, favorites and replies your tweets generated on a daily basis. Next, you get statistics about the hashtags you used in your tweets in the last days set in the Time Machine, those hashtags can be ordered by alphabetical order, by frequency or by engagement generated. Finally, the intersecting circles in the Venn diagram represent the respective sizes of your total followers, their activity (at least sent one tweet in the last XX days) and their engagement towards your account. Let's walk through the stats and functionalities available in the app.

#### Time Machine
![](/screenshots/03_TimeMachine.jpg)

Adjust the time period of the stats with the slider. This allows you to visualize the evolution of your account and adapts all of the stats in the visualization.

![](/screenshots/04_TimeMachineStats.jpg)

#### Sidebar

##### Active followers
A follower is considered active if he has tweeted at least once within the time span of the Time Machine.
The hover indications present details about the "health" of your followers. If a user has a pristine default account that is not protected and follows way more people than is followed by (ratio of following/followers similar to 10'000 to 20), we assume that it is some kind of spam account. You can click on this value to display a full list of those accounts and delete them from your followers if you want. The users that have at least tweeted once (even out of the Time Machine limit) are considered as Standard users. Finally, there is the number of verified accounts of official users.

![](/screenshots/05_HoverStats.jpg)


##### Engaged followers
For the purpose of this project, we consider the engaged (cf [engagement](https://github.com/quentindelattre/nest#engagement)) followers as those who have retweeted your tweets and/or added them to their favorites and/or mentioned your @handle, should it be in a reply to your tweets of by direct mention.

#### Visualization

The bar chart represents the daily amount of retweets, mentions and replies to your tweets over the whole Time Machine span. You can therefore see when your account was especially successful with your community. When a specific spike intrigues you, click on it and all your tweets from that day show up with the most successful first. That way, you can analyze your timeline to find out what kind of content really works with your followers.

![](/screenshots/07_TweetsFromDay.jpg)

The hashtags visualization allows you to gain insight over the content of your tweets and the kind of engagement they generated. By default, the 15 most frequent hashtags are displayed, ordered by engagement. You can change the order of this list to see whether the hashtags you use most frequently have a good impact on your community of not. Same as for the bar charts, when you click on the pie chart or on the hashtag, your tweets containing them come up on screen.

![](/screenshots/06.1_HashtagsChange.jpg)

The Venn diagram adjust with the Time Machine, on hover, the value of the circle is displayed in a tooltip. This tool allows you to visualize the growth of the sub-elements of your followers over time.

# Copyright & License

Copyright © 2015 Quentin de Lattre (Bachelor Project at  [HEIG-VD](http://www.heig-vd.ch))

Licensed under the MIT License.
