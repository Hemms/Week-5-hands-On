//dom manipulation

document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('form');

    form.addEventListener('submit', async (e) =>{
        e.preventDefault();

        //load the form details ie. username password and email

        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');
        

        try{
            const response = await fetch('http://localhost:5502/api/register',
                 {
                method: 'post',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({email, username, password})
            })
            const data = await response.json();
            if(!response.ok){
                authMsg.textContent = data.message || 'login failed try again.';
            }
            else{
                authMsg.textContent = 'access granted';

                //redirect to login page
                setTimeout(()=>{
                    window.location.href = 'login.html';
                }, 1000);
            }
        } catch (err){
            authMsg.textContent = 'an error occurred: ' +  err.message;
        }

    });
});