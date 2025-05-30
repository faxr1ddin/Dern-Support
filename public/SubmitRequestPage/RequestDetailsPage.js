document.addEventListener('DOMContentLoaded', async function () {
    const currentUserEmail = sessionStorage.getItem('currentUser');
    const ticketId = sessionStorage.getItem('currentRequestId');

    if (!currentUserEmail) {
        window.location.href = '../LoginPage/LoginPage.html';
        return;
    }

    if (!ticketId) {
        try {
            const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
            if (userResponse.ok) {
                const currentUser = await userResponse.json();
                window.location.href = currentUser.isAdmin
                    ? '../DashboardPage/AdminDashboard.html'
                    : '../DashboardPage/Dashboard.html';
            } else {
                window.location.href = '../LoginPage/LoginPage.html';
            }
        } catch (error) {
            window.location.href = '../LoginPage/LoginPage.html';
        }
        return;
    }

    try {
        const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
        if (!userResponse.ok) {
            throw new Error('User not found');
        }
        const currentUser = await userResponse.json();

        const requestsResponse = await fetch(`http://localhost:3000/api/support-requests`);
        if (!requestsResponse.ok) {
            throw new Error('Failed to fetch requests');
        }
        const allRequests = await requestsResponse.json();
        const request = allRequests.find(r => String(r.ticketId) === String(ticketId));

        if (!request) {
            alert('Request not found');
            window.location.href = currentUser.isAdmin
                ? '../DashboardPage/AdminDashboard.html'
                : '../DashboardPage/Dashboard.html';
            return;
        }

        setupUserInfo(currentUser);
        setupNavigation(currentUser);
        displayRequestDetails(request, currentUser);

        if (currentUser.isAdmin) {
            setupAdminActions(ticketId);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load request details');
        const currentUserEmail = sessionStorage.getItem('currentUser');
        if (currentUserEmail) {
            const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
            if (userResponse.ok) {
                const currentUser = await userResponse.json();
                window.location.href = currentUser.isAdmin
                    ? '../DashboardPage/AdminDashboard.html'
                    : '../DashboardPage/Dashboard.html';
            }
        } else {
            window.location.href = '../LoginPage/LoginPage.html';
        }
    }
});

function setupUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const accountType = document.getElementById('accountType');
    const accountTypeDisplay = document.getElementById('accountTypeDisplay');

    if (user.type === 'individual') {
        const fullName = user['full-name'] || 'Guest';
        welcomeMessage.textContent = `Welcome, ${fullName}!`;
        accountType.textContent = 'INDIVIDUAL';
        accountTypeDisplay.textContent = 'Individual Account';
        userAvatar.textContent = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (user.type === 'business') {
        const businessName = user['business-name'] || 'Business Account';
        welcomeMessage.textContent = `Welcome, ${businessName}!`;
        accountType.textContent = 'BUSINESS';
        accountTypeDisplay.textContent = 'Business Account';
        userAvatar.textContent = businessName.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (user.isAdmin) {
        welcomeMessage.textContent = 'Welcome, Admin!';
        accountType.textContent = 'ADMINISTRATOR';
        accountTypeDisplay.textContent = 'Admin Panel';
        userAvatar.textContent = 'AD';
    }
}

function setupNavigation(user) {
    const sidebarNav = document.getElementById('sidebarNav');

    if (user.isAdmin) {
        sidebarNav.innerHTML = `
            <a href="../DashboardPage/AdminDashboard.html">Dashboard</a>
            <a href="#../DashboardPage/AdminDashboard.html">All Requests</a>
            <a href="../MainPage/MainPage.html">Leave</a>
        `;
    } else {
        sidebarNav.innerHTML = `
            <a href="../DashboardPage/Dashboard.html">Dashboard</a>
            <a href="#">My Support Requests</a>
            <a href="#">Knowledge Base</a>
            <a href="../MainPage/MainPage.html">Leave</a>
        `;
    }
}

async function displayRequestDetails(request, currentUser) {
    document.getElementById('ticketId').textContent = request.ticketId;
    document.getElementById('title').textContent = request.title;
    document.getElementById('customerType').textContent = request.customerType === 'individual' ? 'Individual' : 'Business';
    document.getElementById('problemType').textContent = request.problemType.charAt(0).toUpperCase() + request.problemType.slice(1);
    document.getElementById('urgency').textContent = request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1);
    document.getElementById('description').textContent = request.description;

    document.getElementById('estimatedPrice').textContent = `$${request.estimatedPrice.toFixed(2) || 'Not estimated'}`;
    document.getElementById('priceApproved').textContent = request.approvedPrice ? 'Yes' : 'No';

    const formattedDate = new Date(request.date).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('submittedDate').textContent = formattedDate;

    const statusElement = document.getElementById('status');
    statusElement.textContent = request.status;
    statusElement.className = 'detail-value status';
    statusElement.classList.add(`status-${request.status.toLowerCase()}`);

    if (currentUser.isAdmin) {
        try {
            const sparePartsResponse = await fetch(`http://localhost:3000/api/spare-parts/used/${request.ticketId}`);
            const sparePartsData = await sparePartsResponse.json();
            const sparePartsCost = sparePartsData.totalCost || request.sparePartsCost || 0;

            const adminActions = document.createElement('div');
            adminActions.id = 'adminActions';
            adminActions.style.display = 'block';
            adminActions.innerHTML = `
                <div class="action-buttons" style="margin-top: 20px;">
                    <button class="btn-action btn-pending" onclick="updateRequestStatus('${request.ticketId}', 'pending')">Mark as Pending</button>
                    <button class="btn-action btn-resolve" onclick="updateRequestStatus('${request.ticketId}', 'resolved')">Mark asResolved</button>
                    <div class="price-adjustment" style="margin-top: 15px;">
                        <label for="finalPriceInput">Set Final Price ($):</label>
                        <input type="number" id="finalPriceInput" value="${request.estimatedPrice || ''}" min="0" step="0.01">
                        <p>Spare Parts Cost: $${sparePartsCost.toFixed(2)}</p>
                        <button class="btn-action" onclick="setFinalPrice('${request.ticketId}')">Set Price</button>
                    </div>
                </div>
            `;
            document.querySelector('.request-details').appendChild(adminActions);
        } catch (error) {
            console.error('Error fetching spare parts data:', error);
            alert('Failed to load spare parts data for pricing.');
        }
    }
}

async function updateRequestStatus(ticketId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/support-requests/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        const updatedRequest = await response.json();

        const currentUserEmail = sessionStorage.getItem('currentUser');
        const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
        const currentUser = await userResponse.json();

        displayRequestDetails(updatedRequest, currentUser);
        alert(`Status updated to ${updatedRequest.status}`);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update request status. Please try again.');
    }
}

async function setFinalPrice(ticketId) {
    const finalPriceInput = document.getElementById('finalPriceInput');
    const finalPrice = parseFloat(finalPriceInput.value);

    if (isNaN(finalPrice) || finalPrice <= 0) {
        alert('Please enter a valid price');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/support-requests/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ finalPrice: finalPrice })
        });

        if (!response.ok) {
            throw new Error('Failed to update price');
        }

        const updatedRequest = await response.json();

        const currentUserEmail = sessionStorage.getItem('currentUser');
        const userResponse = await fetch(`http://localhost:3000/api/user/${currentUserEmail}`);
        const currentUser = await userResponse.json();

        displayRequestDetails(updatedRequest, currentUser);
        alert(`Final price set to $${updatedRequest.finalPrice}`);
    } catch (error) {
        console.error('Error updating price:', error);
        alert('Failed to update request price. Please try again.');
    }
}
