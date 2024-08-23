let sessionId;
document.addEventListener('DOMContentLoaded', () => {
    // Check if sessionId exists in localStorage
    const token = sessionStorage.getItem('token');

    if (!token) {
        window.location.replace('./login.html'); // Redirect if not logged in
    } else {
        // Fetch and display expenses if logged in
        fetchExpenses();
    }

    // Adding event listener for form submission to add expenses
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            addExpense();
        });
    }


function fetchExpenses() {
    fetch('http://localhost:5502/api/expenses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': Bearer ${token} // Include the token here
        }
    })

    .then(response => {
        if(!response.ok){
            throw new Error(HTTP error! status: &{response.status});
        }
        return response.json();
    })
    .then(expenses => {
        console.log(expenses); // Handle the fetched expenses
        displayExpenses(expenses); // Call a function to display expenses
    })
    .catch(error => {
        console.error('Error fetching expenses:', error);
    });
}

function addExpense() {
    const formData = new FormData(document.getElementById('transactionForm'));
    const data = {
        amount: formData.get('amount'),
        date: formData.get('date'),
        category: formData.get('category'),
        type: formData.get('type') 
    };
    console.log('Token:', token);
    console.log('submitting data:', data);

    //fetching from backend
    fetch('http://localhost:5502/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': Bearer ${token}
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log(result.message);
        fetchExpenses(); // Refresh the list after adding a new expense
    })
    .catch(error => {
        console.error('Error adding expense:', error);
    });
}

function displayExpenses(expenses) {
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
        transactionList.innerHTML = ''; // Clear existing transactions
        let listItem =''
        expenses.forEach(expense => {
            listItem= `${listItem}<tr>
                <td>${expense?.category}</td>
                <td>${expense?.amount}</td>
                <td>${expense?._date}</td>
            </tr>`
            
           
            transactionList.innerHTML =listItem;
        });
    }
}
});