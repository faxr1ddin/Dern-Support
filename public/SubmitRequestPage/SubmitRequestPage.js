document.addEventListener('DOMContentLoaded', function () {
    const priceEstimates = {
        hardware: { low: 50, medium: 100, high: 200, sparePartsBase: 30 },
        software: { low: 30, medium: 60, high: 120, sparePartsBase: 0 },
        network: { low: 80, medium: 150, high: 250, sparePartsBase: 20 },
        other: { low: 40, medium: 80, high: 160, sparePartsBase: 10 }
    };

    const customerTypeRadios = document.querySelectorAll('input[name="customerType"]');
    const individualInfo = document.getElementById('individualInfo');
    const businessInfo = document.getElementById('businessInfo');

    customerTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === 'individual') {
                individualInfo.classList.add('show');
                businessInfo.classList.remove('show');
            } else {
                individualInfo.classList.remove('show');
                businessInfo.classList.add('show');
            }
            updatePriceEstimate();
        });
    });

    document.getElementById('problemType').addEventListener('change', updatePriceEstimate);
    document.getElementById('urgency').addEventListener('change', updatePriceEstimate);

    async function updatePriceEstimate() {
        const problemType = document.getElementById('problemType').value.toLowerCase();
        const urgency = document.getElementById('urgency').value;
        const priceEstimation = document.getElementById('priceEstimation');
        const approvalSection = document.getElementById('approvalSection');

        if (!problemType || !urgency || !priceEstimates[problemType]) {
            priceEstimation.innerHTML = '<p>Please select a valid problem type and urgency to see estimated cost</p>';
            approvalSection.style.display = 'none';
            return;
        }

        let sparePartsCost = priceEstimates[problemType].sparePartsBase; 
        try {
            const sparePartsResponse = await fetch(`https://dern-support-official-7zzw.onrender.com/api/spare-parts/${problemType}`);
            if (sparePartsResponse.ok) {
                const sparePartsData = await sparePartsResponse.json();
                sparePartsCost = sparePartsData.cost || sparePartsCost;
            } else {
                console.warn(`API call failed for spare parts, using fallback cost: $${sparePartsCost}`);
            }
        } catch (error) {
            console.warn(`Error fetching spare parts cost, using fallback: $${sparePartsCost}`, error);
        }

        const basePrice = priceEstimates[problemType][urgency];
        const customerType = document.querySelector('input[name="customerType"]:checked')?.value || 'individual';
        const businessPremium = customerType === 'business' ? basePrice * 0.2 : 0;
        const totalPrice = basePrice + businessPremium + sparePartsCost;

        priceEstimation.innerHTML = `
            <div class="price-breakdown">
                <p>Base price (${problemType} issue): $${basePrice.toFixed(2)}</p>
                <p>Spare parts cost: $${sparePartsCost.toFixed(2)}</p>
                ${customerType === 'business' ? `<p>Business service premium (20%): $${businessPremium.toFixed(2)}</p>` : ''}
                <p class="total-price">Estimated total: <strong>$${totalPrice.toFixed(2)}</strong></p>
            </div>
        `;
        approvalSection.style.display = 'block';
    }

    const supportRequestForm = document.getElementById('supportRequestForm');
    if (supportRequestForm) {
        supportRequestForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const currentUserEmail = sessionStorage.getItem('currentUser');
            if (!currentUserEmail) {
                alert('You must be logged in to submit a request.');
                window.location.href = '../LoginPage/LoginPage.html';
                return;
            }

            const problemType = document.getElementById('problemType').value.toLowerCase();
            const urgency = document.getElementById('urgency').value;
            const customerType = document.querySelector('input[name="customerType"]:checked')?.value || 'individual';

            if (!problemType || !urgency || !priceEstimates[problemType]) {
                alert('Please select a valid problem type and urgency.');
                return;
            }

            let sparePartsCost = priceEstimates[problemType].sparePartsBase;
            try {
                const sparePartsResponse = await fetch(`https://dern-support-official-7zzw.onrender.com/api/spare-parts/${problemType}`);
                if (sparePartsResponse.ok) {
                    const sparePartsData = await sparePartsResponse.json();
                    sparePartsCost = sparePartsData.cost || sparePartsCost;
                }
            } catch (error) {
                console.warn(`Error fetching spare parts cost, using fallback: $${sparePartsCost}`, error);
            }

            const basePrice = priceEstimates[problemType][urgency];
            const businessPremium = customerType === 'business' ? basePrice * 0.2 : 0;
            const finalPrice = basePrice + businessPremium + sparePartsCost;

            const requestData = {
                title: document.getElementById('requestTitle').value,
                customerType: customerType,
                problemType: problemType,
                urgency: urgency,
                description: document.getElementById('description').value,
                email: currentUserEmail,
                status: 'New',
                estimatedPrice: finalPrice,
                approvedPrice: document.getElementById('approveEstimate').checked,
                sparePartsCost: sparePartsCost
            };

            try {
                const response = await fetch('https://dern-support-official-7zzw.onrender.com/api/support-requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit request');
                }

                window.location.href = '../DashboardPage/Dashboard.html';
            } catch (error) {
                console.error('Error submitting request:', error);
                alert('Failed to submit support request. Please try again.');
            }
        });
    }
});