# Peer Tutoring Service Web API

## Project Overview
This application provides a RESTful Web API for a basic peer-to-peer tutoring service. The service allows Users to sign-up/login through a Google account, and then to use a JWT to authenticate when accessing the API. By signing up, Users can schedule tutoring appointments for themselves, which are then available for other students to book. Students, who do not need to sign up/authenticate, can enter basic information about themselves (a Student record) and then book appointments that have been made available by registered Users (Tutors). Other than the initial authorization/authentication, there is no front-end implementation.

## Motivations
This application is a final project for my Cloud Development course at Oregon State University (CS 493 - Spring 2022). We were allowed to choose our own context for the application. Because of my background in education and my interest in developing programs that simplify and improve educational administrative functions, I chose the context of a peer tutoring service (a type of service I have experience designing and implementing). A key goal in the design of this application was to provide a service that students could hypothetically use to administer their own tutoring services without a great deal of administrative oversite (basically running their own schedule).

## Skills Displayed
Developing the application gave me experience in setting up authorization/authentication pipelines, designing a RESTful API, and modelling and implementing a NoSQL database deployed in the Cloud. I also developed a full testing suite for the API (Postman). Finally, I gained experience writing a detailed spec for the API.

## Technology
Node.js server with Express
Google Datastore

## API Spec
[Peer Tutoring API Spec Document (PDF)](./swenddaj_project.pdf).




