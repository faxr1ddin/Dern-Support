document.addEventListener('DOMContentLoaded', async function () {
    const currentUserEmail = sessionStorage.getItem('currentUser');

    if (!currentUserEmail) {
        window.location.href = '../LoginPage/LoginPage.html';
        return;
    }

    try {
        const userResponse = await fetch(`https://dern-support-official-7zzw.onrender.com/api/user/${currentUserEmail}`);
        if (!userResponse.ok) {
            throw new Error('User not found');
        }
        const currentUser = await userResponse.json();

        if (currentUser.isAdmin) {
            window.location.href = '../AdminDashboard/AdminDashboard.html';
            return;
        }

        const welcomeElement = document.getElementById('welcomeMessage');
        const accountTypeElement = document.querySelector('.account-type');
        const sidebarAccountType = document.querySelector('.sidebar-header p');

        if (currentUser.type === 'individual') {
            const fullName = currentUser['full-name'] || 'Guest';
            welcomeElement.textContent = `Welcome, ${fullName}!`;
            accountTypeElement.textContent = 'INDIVIDUAL';
            sidebarAccountType.textContent = 'Individual Account';
        } else if (currentUser.type === 'business') {
            const businessName = currentUser['business-name'] || 'Business Account';
            welcomeElement.textContent = `Welcome, ${businessName}!`;
            accountTypeElement.textContent = 'BUSINESS';
            sidebarAccountType.textContent = 'Business Account';
        }

        const adminLinks = document.querySelectorAll('a[href*="AdminDashboard"]');
        adminLinks.forEach(link => {
            link.style.display = 'none';
        });

        await displayRecentRequests(currentUserEmail);

        document.getElementById('viewAllRequests').addEventListener('click', async function (e) {
            e.preventDefault();
            await displayAllRequests(currentUserEmail);
            document.getElementById('viewAllRequests').style.display = 'none';
            document.getElementById('showRecentRequests').style.display = 'inline';
        });

        document.getElementById('showRecentRequests').addEventListener('click', async function (e) {
            e.preventDefault();
            await displayRecentRequests(currentUserEmail);
            document.getElementById('viewAllRequests').style.display = 'inline';
            document.getElementById('showRecentRequests').style.display = 'none';
        });

        document.getElementById('myRequestsLink').addEventListener('click', async function (e) {
            e.preventDefault();
            await displayAllRequests(currentUserEmail);
            document.getElementById('viewAllRequests').style.display = 'none';
            document.getElementById('showRecentRequests').style.display = 'inline';
        });

    } catch (error) {
        console.error('Error:', error);
        window.location.href = '../LoginPage/LoginPage.html';
    }
});

async function displayRecentRequests(userEmail) {
    try {
        const response = await fetch(`https://dern-support-official-7zzw.onrender.com/api/support-requests/${userEmail}`);
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        const userRequests = await response.json();

        const requestsTable = document.getElementById('requestsTableBody');
        const requestsHeader = document.getElementById('requestsHeader');

        requestsHeader.textContent = 'My Recent Support Requests';
        requestsTable.innerHTML = '';

        userRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

        const recentRequests = userRequests.slice(0, 2);

        populateRequestsTable(recentRequests, requestsTable);

        if (recentRequests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No requests found</td>`;
            requestsTable.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading recent requests:', error);
        const requestsTable = document.getElementById('requestsTableBody');
        requestsTable.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading requests</td></tr>`;
    }
}

async function displayAllRequests(userEmail) {
    try {
        const response = await fetch(`https://dern-support-official-7zzw.onrender.com/api/support-requests/${userEmail}`);
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        const userRequests = await response.json();

        const requestsTable = document.getElementById('requestsTableBody');
        const requestsHeader = document.getElementById('requestsHeader');

        requestsHeader.textContent = 'All My Support Requests';
        requestsTable.innerHTML = '';

        userRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

        populateRequestsTable(userRequests, requestsTable);

        if (userRequests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No requests found</td>`;
            requestsTable.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading all requests:', error);
        const requestsTable = document.getElementById('requestsTableBody');
        requestsTable.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading requests</td></tr>`;
    }
}

function populateRequestsTable(requests, tableElement) {
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

        row.innerHTML = `
            <td>${request.ticketId}</td>
            <td>${request.title}</td>
            <td>${formattedDate}</td>
            <td><span class="status ${statusClass}">${request.status}</span></td>
            <td><a href="#" class="btn-text" onclick="viewRequest('${request.ticketId}')">View</a></td>
        `;

        tableElement.appendChild(row);
    });
}

function viewRequest(ticketId) {
    sessionStorage.setItem('currentRequestId', ticketId);
    window.location.href = '../SubmitRequestPage/RequestDetailsPage.html';
}