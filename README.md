# Peer Tutoring Service Web API

## Project Overview
This application provides a RESTful Web API for a basic peer-to-peer tutoring service. The service allows Users to sign-up/login through a Google account, and then to use a JWT to authenticate when accessing the API. By signing up, Users can schedule tutoring appointments for themselves, which are then available for other students to book. Students, who do not need to sign up/authenticate, can enter basic information about themselves (a Student record) and then book appointments that have been made available by registered Users (Tutors). Other than the initial authorization/authentication, there is no front-end implementation.

## Motivations
This application is a final project for my Cloud Development course at Oregon State University (CS 493). We were allowed to choose our own context for the application. Because of my background in education and my interest in developing programs that simplify and improve educational administrative functions, I chose the context of a peer tutoring service, which is a type of service I have experience designing and implementing. A key aim of this application was to provide the structure of a service that students could hypothetically use to administer their own tutoring services without a great deal of administrative oversight (basically running their own schedule).

## Skills Displayed
Developing the application gave me experience in setting up authorization/authentication pipelines, designing a RESTful API, and modeling and implementing a NoSQL database deployed in the Cloud. I also developed a full testing suite for the API (with Postman). Finally, I gained technical writing experience in documenting the specifications of the API.

## Technology
Node.js server with Express

Google Cloud Datastore

## Full API Spec
[Peer Tutoring API Spec Document (PDF)](./swenddaj_project.pdf).




