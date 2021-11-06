"use strict";
require("dotenv").config();
const figlet = require("figlet");
const mongoose = require("mongoose");
const _ = require("lodash");
const { prompt } = require("enquirer");
const clear = require("clear");
const chalk = require("chalk");
const { capitalize } = require("lodash");
const open = require("open");
const print = console.log;

const splash = figlet.textSync("Rent Manager");

const Tenant = mongoose.model("Tenant", {
     tenantID: String,
     roomID: String,
     name: String,
     verified: String,
     aadhaar: String,
     occupation: String,
     mobile: String,
     altMobile: String,
     email: String,
     dob: String,
     permanentAddress: String,
     movedIn: String,
     unitsWhenMovedIn: String,
     leftOn: String,
     security: String,
     keycard: String,
     agreement: String,
});

const Year = mongoose.model("Year", {
     year: String,
     total: {
          type: Number,
          default: 0,
     },
     january: {
          type: Object,
          default: {
               total: 0,
          },
     },
     february: {
          type: Object,
          default: {
               total: 0,
          },
     },
     march: {
          type: Object,
          default: {
               total: 0,
          },
     },
     april: {
          type: Object,
          default: {
               total: 0,
          },
     },
     may: {
          type: Object,
          default: {
               total: 0,
          },
     },
     june: {
          type: Object,
          default: {
               total: 0,
          },
     },
     july: {
          type: Object,
          default: {
               total: 0,
          },
     },
     august: {
          type: Object,
          default: {
               total: 0,
          },
     },
     september: {
          type: Object,
          default: {
               total: 0,
          },
     },
     october: {
          type: Object,
          default: {
               total: 0,
          },
     },
     november: {
          type: Object,
          default: {
               total: 0,
          },
     },
     december: {
          type: Object,
          default: {
               total: 0,
          },
     },
});

/*********************** MAIN EXECUTION ********************/
(async function connectDatabase() {
     try {
          await mongoose.connect(process.env.DB_URL);
     } catch (error) {
          print("Couldn't connect to database...");
          process.exit();
     }

     print(chalk.green("Connected to database..."));
     askLogin();
})();
/*********************** FUNCTIONS ********************/
async function askLogin() {
     let tries = 3;

     const login = await prompt({
          type: "basicauth",
          name: "login",
          message: "Please login to continue.",
          username: process.env.USERNAME,
          password: process.env.PASSWORD,
          showPassword: false,
          validate: (result) => {
               if (result) return true;
               if (tries == 1) {
                    print(chalk.red(`Failed to login. Closing application.`));
                    process.exit();
               } else tries--;
               return `Password did not match. You have ${tries} ${tries == 1 ? "try" : "tries"} remaining.`;
          },
     });

     login ? mainMenu() : process.exit();
}
async function mainMenu() {
     clear();
     print(splash);

     const { choice } = await prompt({
          type: "select",
          name: "choice",
          message: `Hi! what's your next move?`,
          choices: ["Records", "Tenants", "Legal", "Exit"],
          initial: 0,
     });

     if (choice === "Records") choiceRecords();
     else if (choice === "Tenants") choiceTenants();
     else if (choice === "Legal") choiceLegal();
     else if (choice === "Exit") {
          asciiArt("Good Bye!");
          process.exit();
     }
}
/********************************* choice : Records ***********************************************/
async function choiceRecords() {
     clear();
     print(splash);

     let years = await Year.find({}, "year total");
     let y = [];
     if (years.length) y = years.map((year) => year.year);

     const { choice } = await prompt({
          type: "select",
          name: "choice",
          message: "Records",
          choices: y.concat(["Total", "Add year", "Delete year", "Go Back"]),
          initial: y.indexOf(String(new Date().getFullYear())),
     });

     if (choice === "Total") showTotal(years);
     else if (choice === "Go Back") mainMenu();
     else if (choice === "Add year") addYear();
     else if (choice === "Delete year") deleteYear();
     else selectYear(choice);
}
async function addYear() {
     clear();
     print(splash);

     const years = await Year.find({}, "year");
     let year;

     try {
          await prompt({
               type: "input",
               name: "year",
               message: "Create a new year\n\nPress CTRL + C to discard",
               validate: (answer) => {
                    if (answer === "") return `Year can't be empty`;
                    else {
                         if (years.length == 0) return true;
                         else {
                              for (let i = 0; i < years.length; i++) {
                                   if (years[i].year === answer) return `Year ${answer}, already exists.`;
                              }
                              return true;
                         }
                    }
               },
          }).then((answer) => {
               year = answer.year;
          });
     } catch (error) {
          choiceRecords();
     }

     if (year) {
          await new Year({ year: year }).save();
          choiceRecords();
     }
}
async function deleteYear() {
     clear();
     print(splash);

     let years = await Year.find({}, "year");
     if (years.length) years = years.map((year) => year.year);
     years.push("Go Back");

     const { yearToDelete } = await prompt({
          type: "select",
          name: "yearToDelete",
          message: "Select an year to delete",
          choices: years,
     });

     if (yearToDelete === "Go Back") choiceRecords();
     else {
          Year.findOneAndDelete({ year: yearToDelete }, (err, data) => {
               if (data) choiceRecords();
          });
          // choiceRecords();
     }
}
async function selectYear(currentYear, currentMonth) {
     clear();
     print(splash);

     let year = await Year.findOne({ year: currentYear });
     let month = undefined;

     if (!currentMonth) {
          month = await prompt({
               type: "select",
               name: "month",
               message: currentYear,
               choices: [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                    "Total",
                    "Go Back",
                    "Main Menu",
               ],
               initial: new Date().getMonth(),
          });

          month = month.month;
     } else month = currentMonth;

     if (month === "Total") showYearTotal(year);
     else if (month === "Go Back") choiceRecords();
     else if (month === "Main Menu") mainMenu();
     else {
          month = month.toLowerCase();

          let rooms = [];
          if (year[month].rooms) rooms = Object.keys(year[month].rooms);
          rooms.push("Add Room", "Update Room", "Delete Room", "Go Back");

          clear();
          print(splash);

          let { room } = await prompt({
               type: "select",
               name: "room",
               message: `${currentYear} / ${capitalize(month)}`,
               choices: rooms,
               initial: rooms.indexOf("Add Room"),
          });

          if (room === "Add Room") addRoom(year, month);
          else if (room === "Update Room") updateRoom(year, month);
          else if (room === "Delete Room") deleteRoom(year, month);
          else if (room === "Go Back") selectYear(currentYear);
          else showRoom(year, month, room);
     }
}
async function showTotal(years) {
     clear();
     print(splash);

     let data = {};
     years.map((e) => {
          data[e.year] = e.total;
     });

     data.Total = Object.values(data).reduce((total, e) => (total += e), 0);

     console.table(data);

     prompt({
          type: "select",
          name: "choice",
          choices: ["Go Back"],
     }).then((answer) => {
          choiceRecords();
     });
}
/************** room functions ************/
async function showRoom(year, month, room) {
     clear();
     print(splash);

     print(`${year.year} / ${capitalize(month)} / ${room}`);
     console.table(year[month].rooms[room]);

     const { choice } = await prompt({
          type: "select",
          name: "choice",
          choices: ["Go Back", "Main Menu"],
          initial: 0,
     });

     if (choice === "Go Back") selectYear(year.year, month);
     else if (choice === "Main Menu") mainMenu();
}
async function addRoom(year, month) {
     clear();
     print(splash);

     let newRoom;

     try {
          await prompt({
               type: "form",
               name: "newRoom",
               message: `${year.year} / ${capitalize(month)} / Create Room:\n\nPress CTRL + C to discard`,
               choices: [
                    { name: "room", message: "Room" },
                    { name: "building", message: "Building" },
                    { name: "type", message: "Room Type" },
                    { name: "date", message: "Date" },
                    { name: "tenant", message: "Tenant" },
                    { name: "rent", message: "Rent", initial: "0" },
                    { name: "paymentMethod", message: "Payment Method", initial: "Cash" },
                    { name: "unitsFrom", message: "Units from", initial: "0" },
                    { name: "unitsTo", message: "Units to", initial: "0" },
                    { name: "misc", message: "Miscellaneous charges", initial: "0" },
                    { name: "notes", message: "Notes (if any)" },
               ],
               validate: ({ room }) => {
                    if (room === "") return `Room can't be empty`;
                    else if (year[month].rooms && year[month].rooms.hasOwnProperty(capitalize(room)))
                         return `Room: ${room} already exists...`;
                    return true;
               },
          }).then((answer) => {
               newRoom = answer.newRoom;
          });
     } catch (error) {
          selectYear(year.year, month);
     }

     if (newRoom) {
          for (const key in newRoom) newRoom[key] = capitalize(newRoom[key]);
          // type cast rent, unitsTo, unitsFrom and misc
          newRoom.rent = parseInt(newRoom.rent);
          newRoom.unitsTo = parseInt(newRoom.unitsTo);
          newRoom.unitsFrom = parseInt(newRoom.unitsFrom);
          newRoom.misc = parseInt(newRoom.misc);

          // calculate electricity and total charges
          newRoom.electricity = (newRoom.unitsTo - newRoom.unitsFrom) * 9;
          newRoom.total = newRoom.rent + newRoom.electricity + newRoom.misc;
          // if rooms is undefined then initialize it or save the room directly
          if (!year[month].rooms) year[month].rooms = {};
          year[month].rooms[newRoom.room] = newRoom;
          // add newRoom's total to month's total
          year[month].total += newRoom.total;
          year.total += newRoom.total;

          await new Year(year).save();
          selectYear(year.year, month);
     }
}
async function updateRoom(year, month) {
     clear();
     print(splash);

     let rooms = [];
     if (year[month].rooms) rooms = Object.keys(year[month].rooms);
     rooms.push("Go Back");

     let { roomToUpdate } = await prompt({
          type: "select",
          name: "roomToUpdate",
          message: `${year.year} / ${capitalize(month)} / Update Room`,
          choices: rooms,
     });

     if (roomToUpdate === "Go Back") selectYear(year.year, month);
     else {
          const data = year[month].rooms[roomToUpdate];
          const { newRoom } = await prompt({
               type: "form",
               name: "newRoom",
               message: `${year.year} / ${capitalize(month)} / Update Room : ${roomToUpdate}`,
               choices: [
                    { name: "room", message: "Room", initial: data.room },
                    { name: "building", message: "Building", initial: data.building },
                    { name: "type", message: "Room Type", initial: data.type },
                    { name: "date", message: "Date", initial: data.date },
                    { name: "tenant", message: "Tenant", initial: data.tenant },
                    { name: "rent", message: "Rent", initial: String(data.rent) },
                    { name: "paymentMethod", message: "Payment Method", initial: data.paymentMethod },
                    { name: "unitsFrom", message: "Units from", initial: String(data.unitsFrom) },
                    { name: "unitsTo", message: "Units to", initial: String(data.unitsTo) },
                    { name: "misc", message: "Miscellaneous charges", initial: String(data.misc) },
                    { name: "notes", message: "Notes (if any)", initial: data.notes },
               ],
          });

          for (const key in newRoom) newRoom[key] = capitalize(newRoom[key]);
          // type cast rent, unitsTo, unitsFrom and misc
          newRoom.rent = parseInt(newRoom.rent);
          newRoom.unitsTo = parseInt(newRoom.unitsTo);
          newRoom.unitsFrom = parseInt(newRoom.unitsFrom);
          newRoom.misc = parseInt(newRoom.misc);

          // calculate electricity and total charges
          newRoom.electricity = (newRoom.unitsTo - newRoom.unitsFrom) * 9;
          newRoom.total = newRoom.rent + newRoom.electricity + newRoom.misc;
          // adjust the month's total based on the changes made
          year[month].total -= year[month].rooms[roomToUpdate].total;
          year.total -= year[month].rooms[roomToUpdate].total;
          year[month].total += newRoom.total;
          year.total += newRoom.total;

          // if rooms is undefined then initialize it or save the room directly
          delete year[month].rooms[roomToUpdate];
          year[month].rooms[newRoom.room] = newRoom;

          new Year(year).save().then((err, data) => selectYear(year.year, month));
     }
}
async function deleteRoom(year, month) {
     clear();
     print(splash);

     let rooms = [];
     if (year[month].rooms) rooms = Object.keys(year[month].rooms);
     rooms.push("Go Back");

     let { roomToDelete } = await prompt({
          type: "select",
          name: "roomToDelete",
          message: `${year.year} / ${capitalize(month)} / Delete Room`,
          choices: rooms,
     });

     if (roomToDelete === "Go Back") selectYear(year.year, month);
     else {
          // adjust the month's total
          year[month].total -= year[month].rooms[roomToDelete].total;
          year.total -= year[month].rooms[roomToDelete].total;

          delete year[month].rooms[roomToDelete];
          new Year(year).save().then((err, data) => selectYear(year.year, month));
     }
}
async function showYearTotal(y) {
     let year = y._doc;
     let years = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
     ];

     let data = {};
     for (const month in year) if (years.includes(month)) data[capitalize(month)] = year[month].total;
     data.Total = Object.values(data).reduce((total, e) => (total += e), 0);

     print(`${y.year} / Total`);
     console.table(data);

     prompt({
          type: "select",
          name: "choice",
          choices: ["Go Back"],
     }).then(({ choice }) => selectYear(year.year));
}
/********************************* choice : Tenants ***********************************************/
async function choiceTenants() {
     clear();
     print(splash);

     const { choice } = await prompt({
          type: "select",
          name: "choice",
          message: "Tenants:",
          choices: [
               "Show all tenants",
               "Add a tenant",
               "Update a tenant",
               "Delete a tenant",
               "Delete multiple tenants",
               "Go Back",
               "Main Menu",
          ],
          initial: 0,
     });

     if (choice === "Show all tenants") showTenants();
     else if (choice === "Add a tenant") addTenant();
     else if (choice === "Update a tenant") updateTenant();
     else if (choice === "Delete a tenant") deleteTenant();
     else if (choice === "Delete multiple tenants") deleteMultipleTenants();
     else if (choice === "Go Back") mainMenu();
     else if (choice === "Main Menu") mainMenu();
}
async function showTenants() {
     clear();
     print(splash);

     const data = await Tenant.find({});
     const newData = data.map((tenant) => {
          return {
               tenantID: tenant.tenantID,
               roomID: tenant.roomID,
               name: tenant.name,
               verified: tenant.verified,
               aadhaar: tenant.aadhaar,
               occupation: tenant.occupation,
               mobile: tenant.mobile,
               altMobile: tenant.altMobile,
               email: tenant.email,
               dob: tenant.dob,
               permanentAddress: tenant.permanentAddress,
               movedIn: tenant.movedIn,
               unitsWhenMovedIn: tenant.unitsWhenMovedIn,
               leftOn: tenant.leftOn,
               security: tenant.security,
               keycard: tenant.keycard,
               agreement: tenant.agreement,
          };
     });

     console.table(newData);

     const { choice } = await prompt({
          type: "select",
          name: "choice",
          choices: ["Go Back", "Main Menu"],
          initial: 0,
     });

     if (choice === "Go Back") choiceTenants();
     else if (choice === "Main Menu") mainMenu();
}
async function addTenant() {
     clear();
     print(splash);

     let tenant;
     try {
          await prompt({
               type: "form",
               name: "tenant",
               message: "Add a new Tenant:",
               choices: [
                    { name: "tenantID", message: "Tenant ID" },
                    { name: "roomID", message: "Room ID" },
                    { name: "name", message: "Name" },
                    { name: "verified", message: "Verification" },
                    { name: "aadhaar", message: "Aadhaar Number" },
                    { name: "occupation", message: "Occupation" },
                    { name: "mobile", message: "Mobile Number" },
                    { name: "altMobile", message: "Alternate Mobile Number" },
                    { name: "email", message: "Email" },
                    { name: "dob", message: "Date of Birth (dd-mm-yyyy)" },
                    { name: "permanentAddress", message: "Permanent Address" },
                    { name: "movedIn", message: "Moved in the room (dd-mm-yyyy)" },
                    { name: "unitsWhenMovedIn", message: "Electricity units when moved in" },
                    { name: "leftOn", message: "Date of leaving (dd-mm-yyyy)" },
                    { name: "security", message: "Security amount (if any)" },
                    { name: "keycard", message: "Key Card number" },
                    { name: "agreement", message: "Rent Agreement Number" },
               ],
          }).then((answer) => {
               tenant = answer.tenant;
          });
     } catch (error) {
          choiceTenants();
     }

     if (tenant) {
          for (const key in tenant) tenant[key] = capitalize(tenant[key]);
          new Tenant(tenant).save();
          choiceTenants();
     }
}
async function updateTenant() {
     let options = await Tenant.find({});
     if (options.length) options = options.map((tenant) => tenant.tenantID);
     options.push("Go Back");

     const { tenantToUpdate } = await prompt({
          type: "select",
          name: "tenantToUpdate",
          message: "Select a tenant to update",
          choices: options,
     });

     if (tenantToUpdate === "Go Back") choiceTenants();
     else {
          const currentTenant = await Tenant.findOne({ tenantID: tenantToUpdate });
          const { updatedTenant } = await prompt({
               type: "form",
               name: "updatedTenant",
               message: `Update the tenant with new information:`,
               choices: [
                    { name: "tenantID", message: "Tenant ID", initial: currentTenant.tenantID },
                    { name: "roomID", message: "Room ID", initial: currentTenant.roomID },
                    { name: "name", message: "Name", initial: currentTenant.name },
                    { name: "verified", message: "Verification", initial: currentTenant.verified },
                    { name: "aadhaar", message: "Aadhaar Number", initial: currentTenant.aadhaar },
                    { name: "occupation", message: "Occupation", initial: currentTenant.occupation },
                    { name: "mobile", message: "Mobile Number", initial: currentTenant.mobile },
                    { name: "altMobile", message: "Alternate Mobile Number", initial: currentTenant.altMobile },
                    { name: "email", message: "Email", initial: currentTenant.email },
                    { name: "dob", message: "Date of Birth (dd-mm-yyyy)", initial: currentTenant.dob },
                    { name: "permanentAddress", message: "Permanent Address", initial: currentTenant.permanentAddress },
                    { name: "movedIn", message: "Moved in the room (dd-mm-yyyy)", initial: currentTenant.movedIn },
                    {
                         name: "unitsWhenMovedIn",
                         message: "Electricity units when moved in",
                         initial: currentTenant.unitsWhenMovedIn,
                    },
                    { name: "leftOn", message: "Date of leaving (dd-mm-yyyy)", initial: currentTenant.leftOn },
                    { name: "security", message: "Security amount (if any)", initial: currentTenant.security },
                    { name: "keycard", message: "Key Card number", initial: currentTenant.keycard },
                    { name: "agreement", message: "Rent Agreement Number", initial: currentTenant.agreement },
               ],
          });

          for (const key in updatedTenant) updatedTenant[key] = capitalize(updatedTenant[key]);
          Tenant.updateOne({ tenantID: tenantToUpdate }, updatedTenant, (err, data) => {});
          choiceTenants();
     }
}
async function deleteTenant() {
     let tenants = await Tenant.find({}, "tenantID");
     if (tenants.length) tenants = tenants.map((tenant) => tenant.tenantID);
     tenants.push("Go Back");

     const { tenant } = await prompt({
          type: "select",
          name: "tenant",
          message: "Select a tenant to delete:",
          choices: tenants,
     });

     if (tenant === "Go Back") choiceTenants();
     else {
          Tenant.findOneAndRemove({ tenantID: tenant }, (err, data) => {});
          choiceTenants();
     }
}
async function deleteMultipleTenants() {
     let tenantIDs = await Tenant.find({}, "tenantID");
     if (tenantIDs.length) tenantIDs = tenantIDs.map((tenant) => tenant.tenantID);
     tenantIDs.push("Go Back");

     const { tenants } = await prompt({
          type: "multiselect",
          name: "tenants",
          message: "Select a tenant to delete:",
          choices: tenantIDs,
     });

     if (tenants.includes("Go Back")) choiceTenants();
     else {
          tenants.map((tenant) => Tenant.findOneAndRemove({ tenantID: tenant }, (err, data) => {}));
          choiceTenants();
     }
}

function catchError(err) {
     print(err);
}
function asciiArt(text) {
     print(figlet.textSync(text));
}
