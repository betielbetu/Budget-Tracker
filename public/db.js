let db;
const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
  // save a reference to the database 
  const db = event.target.result;

  db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  console.log("Error: " + event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget event and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permission
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for "new_budget"
  const store = transaction.objectStore("new_budget");

  // add record to your store with add method
  store.add(record);
}

function uploadBudget() {
  // open a transaction on db
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access object store
  const store = transaction.objectStore("new_budget");

  
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // delete records if successful
          const transaction = db.transaction(["new_budget"], "readwrite");
          const store = transaction.objectStore("new_budget");
          store.clear();
        });
    }
  };
}
function deletePending() {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const store = transaction.objectStore("new_budget");
  store.clear();
}


window.addEventListener("online", uploadBudget);