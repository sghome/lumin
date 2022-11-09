const express = require("express");
const app = express();
const df = require("dialogflow-fulfillment");
const { google } = require("googleapis");



const PORT = process.env.PORT || 3000 ;



const calendarId = process.env.CALENDAR_ID;

const serviceAccount = {
  type: "service_account",
  project_id: "calendario-364517",
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  
  private_key: process.env.GOOGLE_PRIVATE_KEY,
  
  client_email: "calendarioluminas@calendario-364517.iam.gserviceaccount.com",
  
  client_id: process.env.GATSBY_GOOGLE_CLIENT_ID,

  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/calendarioluminas%40calendario-364517.iam.gserviceaccount.com",
}; 


/////////////////////////SENDGRID INTEGRATION///////////////
const sgMail = require('@sendgrid/mail');

///////////////////////////////////////////////////////////



// Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: "https://www.googleapis.com/auth/calendar",
});





const calendar = google.calendar("v3");
process.env.DEBUG = "dialogflow:*"; // enables lib debugging statements

const timeZone = "America/Buenos_Aires";
const timeZoneOffset = "-03:00";





app.listen(PORT ,()=>{
console.log(`El servidor esta corriendo en el puerto ${PORT}`);

});

app.post("/webhook", express.json(), (request, response) =>{
  const agent = new df.WebhookClient({
    request : request,
    response : response
  });




  function makeAppointment(agent){

    let appointment_type = agent.parameters.TipoCita;
    let date = agent.parameters.date;
    let time = agent.parameters.time;
    
    
    let person = agent.parameters.["person"];
    let number = agent.parameters.["number"];
    let email = agent.parameters.["email"];
    

    
    


    
    
    ///////////////////// SENDGRID INTEGRATION ///////////////////
    function SendEmail(agent) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      
      const emailParam = agent.parameters.["email"];
      
      
      const msg = {
  to: emailParam, // Change to your recipient
  from: 'sergio.almagua@gmail.com', // Change to your verified sender
     
  subject: 'Confirmacion de cita Luminas',
  text: 'Tu cita ya esta programada, puedes verla en el calendario de Luminas',
  html: '<strong> Si necesitas màs informaciòn puedes llamarnos al siguiente numero: 300-288-3054 </strong>',
  };

      console.log(msg);
      sgMail.send(msg);
      
    }
    
    
    
    
    //////////////////////////////////////////////////////////////
    
    
    
    
    


    let dateTimeStart = new Date(Date.parse(date.split("T")[0] +
            "T" + time.split("T")[1].split("-")[0] +
            timeZoneOffset));

            let dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));



////////////////////


 const appointmentTimeString = dateTimeStart.toLocaleString("es-ES", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        timeZone: timeZone,
      });







 // Check the availibility of the time, and make an appointment if there is time on the calendar
      return createCalendarEvent(dateTimeStart, dateTimeEnd, appointment_type)
        .then(calendarResponse => {
          agent.add(
            `Ok, dejame reviso. ${appointmentTimeString} esta bien!.`
          );
        })



        .catch(err => {
          agent.add(
            `Lo siento, no hay horarios disponibles ${appointmentTimeString}.`);
        })
    }




    var intentMap = new Map();
    intentMap.set("agendar", makeAppointment);
    intentMap.set(["email"], SendEmail);
    
    agent.handleRequest(intentMap);
  
  });




function createCalendarEvent(dateTimeStart, dateTimeEnd, appointment_type) {
  return new Promise((resolve, reject) => {
    calendar.events.list({

        auth: serviceAccountAuth, // List events for time period
        calendarId: calendarId,
        timeMin: dateTimeStart.toISOString(),
        timeMax: dateTimeEnd.toISOString(),
      }, (err, calendarResponse) => {
        // Check if there is a event already on the Calendar
        if (err || calendarResponse.data.items.length > 0) {
          console.log(err.response.data.error);
          reject(err || new Error("el vento presenta conflicto con otros eventos"));
} 
 else {
          // Create event for the requested time period
          calendar.events.insert({

              auth: serviceAccountAuth,
              calendarId: calendarId,
              resource: {
                summary: appointment_type + ` Agendado `,
                description: appointment_type,
                start: { dateTime: dateTimeStart },
                end: { dateTime: dateTimeEnd }
              }
            }, (err, event) => {
              var data=er ? reject(err) : resolve(events);
            });
        }
      });
  });
}
