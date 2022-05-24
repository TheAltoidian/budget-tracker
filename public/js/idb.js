let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('budget_change', { autoIncrement: true });
};

// store change in database on success, upload it when online
request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// this will run if a budget change happens offline
function saveRecord(record) {
    const transaction = db.transaction(['budget_change'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('budget_change');

    budgetObjectStore.add(record);
};

function uploadBudget() {
    const transaction = db.transaction(['budget_change'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('budget_change');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['budget_change'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('budget_change');
                    budgetObjectStore.clear();

                    alert('All saved budget changes have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };

};

window.addEventListener('online', uploadBudget);