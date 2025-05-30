document.addEventListener('DOMContentLoaded', async function () {
    const currentUserEmail = sessionStorage.getItem('currentUser');

    if (!currentUserEmail) {
        window.location.href = '../LoginPage/LoginPage.html';
        return;
    }

    try {
        const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
        if (!userResponse.ok) {
            throw new Error('User not found');
        }
        const currentUser = await userResponse.json();

        if (!currentUser.isAdmin) {
            window.location.href = '../DashboardPage/Dashboard.html';
            return;
        }

        const welcomeElement = document.querySelector('.user-info span:first-child');
        const accountTypeElement = document.querySelector('.account-type');
        const sidebarAccountType = document.querySelector('.sidebar-header p');

        welcomeElement.textContent = `Welcome, Admin!`;
        accountTypeElement.textContent = 'ADMINISTRATOR';
        sidebarAccountType.textContent = 'Admin Panel';

        await displayAllSupportRequests();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '../LoginPage/LoginPage.html';
    }
});

async function displayAllSupportRequests() {
    try {
        const requestsResponse = await fetch('http://localhost:3000/api/support-requests');
        if (!requestsResponse.ok) {
            throw new Error('Failed to fetch requests');
        }
        const requests = await requestsResponse.json();

        const usersResponse = await fetch('http://localhost:3000/api/users');
        if (!usersResponse.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await usersResponse.json();

        const requestsTableBody = document.getElementById('requestsTableBody');
        requestsTableBody.innerHTML = '';

        if (requests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center;">No support requests found</td>`;
            requestsTableBody.appendChild(row);
            return;
        }

        requests.sort((a, b) => new Date(b.date) - new Date(a.date));

        requests.forEach(request => {
            const row = document.createElement('tr');

            const formattedDate = new Date(request.date).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let statusClass = 'status-new';
            if (request.status.toLowerCase() === 'pending') {
                statusClass = 'status-pending';
            } else if (request.status.toLowerCase() === 'resolved') {
                statusClass = 'status-resolved';
            }

            const user = users.find(u => u.email === request.email);
            let customerName = 'Unknown';
            if (user) {
                customerName = user.type === 'individual'
                    ? (user['full-name'] || 'Individual Customer')
                    : (user['business-name'] || 'Business Customer');
            }

            row.innerHTML = `
            <td>${request.ticketId}</td>
            <td>${request.title}</td>
            <td>${customerName}</td>
            <td>${request.customerType === 'individual' ? 'Individual' : 'Business'}</td>
            <td>${formattedDate}</td>
            <td><span class="status ${statusClass}">${request.status}</span></td>
            <td>${request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}</td>
        `;
        

            requestsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading support requests:', error);
        const requestsTableBody = document.getElementById('requestsTableBody');
        requestsTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error loading support requests</td></tr>`;
    }
}

