document.addEventListener('DOMContentLoaded', function() {
    const clientId = getQueryParameter('id');

    function saveSelection(key, value) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId) || { id: clientId };
        client[key] = value;
        if (!clients.includes(client)) clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
    }

    function loadSelection(key) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        return client ? client[key] : null;
    }

    function saveHouseholdMember(member) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId) || { id: clientId, householdMembers: [] };
    
        if (!clients.includes(client)) clients.push(client);
    
        client.householdMembers = client.householdMembers || [];
        const existingMemberIndex = client.householdMembers.findIndex(m => m.householdMemberId === member.householdMemberId);
    
        if (existingMemberIndex !== -1) {
            // Merge existing data with new data
            client.householdMembers[existingMemberIndex] = {
                ...client.householdMembers[existingMemberIndex], // Preserve existing data
                ...member // Overwrite with new data
            };
        } else {
            client.householdMembers.push(member);
        }
    
        localStorage.setItem('clients', JSON.stringify(clients));
        refreshHouseholdMembersUI();
    }

    function loadHouseholdMembers() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        return client ? client.householdMembers || [] : [];
    }

    function deleteHouseholdMember(memberId) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId);
        if (client && client.householdMembers) {
            client.householdMembers = client.householdMembers.filter(m => m.householdMemberId !== memberId);
            localStorage.setItem('clients', JSON.stringify(clients));
            refreshHouseholdMembersUI();
        }
    }

    function addHouseholdMemberToUI(member) {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('household-member');
        memberDiv.setAttribute('data-id', member.householdMemberId);
    
        // Calculate age
        const dob = new Date(member.dob);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
        memberDiv.innerHTML = `
            <p>Name: ${member.firstName} ${member.middleInitial} ${member.lastName}</p>
            <p>Date of Birth: ${member.dob}</p>
            <p>Age: ${age}</p>
            <p>Marital Status: ${member.maritalStatus}</p>
            <p>On Disability: ${member.disability === 'yes' ? 'Yes' : 'No'}</p>
            <p>On Medicare: ${member.medicare === 'yes' ? 'Yes' : 'No'}</p>
            <p>On Medicaid: ${member.medicaid === 'yes' ? 'Yes' : 'No'}</p>
            <p>Student: ${member.student === 'yes' ? 'Yes' : 'No'}</p>
            <p>Shares Meals: ${member.meals === 'yes' ? 'Yes' : 'No'}</p>
            <button class="edit-member" data-id="${member.householdMemberId}">Edit</button>
        `;
        householdMemberContainer.appendChild(memberDiv);
    
        memberDiv.querySelector('.edit-member').addEventListener('click', function() {
            openEditModal(member);
        });
    }

    function updateHouseholdMemberInUI(member) {
        const memberDiv = document.querySelector(`.household-member[data-id="${member.householdMemberId}"]`);
        if (memberDiv) {
            memberDiv.innerHTML = `
                <p>Name: ${member.firstName} ${member.middleInitial} ${member.lastName}</p>
                <p>Date of Birth: ${member.dob}</p>
                <p>Marital Status: ${member.maritalStatus}</p>
                <p>On Disability: ${member.disability === 'yes' ? 'Yes' : 'No'}</p>
                <p>On Medicare: ${member.medicare === 'yes' ? 'Yes' : 'No'}</p>
                <p>On Medicaid: ${member.medicaid === 'yes' ? 'Yes' : 'No'}</p>
                <p>Student: ${member.student === 'yes' ? 'Yes' : 'No'}</p>
                <p>Shares Meals: ${member.meals === 'yes' ? 'Yes' : 'No'}</p>
                <button class="edit-member" data-id="${member.householdMemberId}">Edit</button>
            `;

            memberDiv.querySelector('.edit-member').addEventListener('click', function() {
                openEditModal(member);
            });
        }
    }

    function removeHouseholdMemberFromUI(memberId) {
        const memberDiv = document.querySelector(`.household-member[data-id="${memberId}"]`);
        if (memberDiv) {
            memberDiv.remove();
        }
    }

    function refreshHouseholdMembersUI() {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        householdMemberContainer.innerHTML = '';
        loadHouseholdMembers().forEach(member => {
            addHouseholdMemberToUI(member);
        });
        checkPrimaryClientButtonVisibility();
    }

    function openEditModal(member) {
        document.getElementById('householdMemberId').value = member.householdMemberId;
        document.getElementById('firstName').value = member.firstName;
        document.getElementById('middleInitial').value = member.middleInitial;
        document.getElementById('lastName').value = member.lastName;
        document.getElementById('dob').value = member.dob;
        document.getElementById('maritalStatus').value = member.maritalStatus;
        setSelectionBox('#disabilityQuestion', member.disability);
        setSelectionBox('#medicareQuestion', member.medicare);
        setSelectionBox('#medicaidQuestion', member.medicaid);
        setSelectionBox('#studentQuestion', member.student);
        setSelectionBox('#mealsQuestion', member.meals);

        document.getElementById('householdMemberModalTitle').innerText = 'Edit Household Member';
        document.getElementById('add-member').style.display = 'none';
        document.getElementById('save-update').style.display = 'block';
        document.getElementById('delete-member').style.display = 'block';
        document.getElementById('householdMemberModal').style.display = 'block';

        // Simulate click on selected elements to update the UI
        document.querySelectorAll('.selection-box div.selected').forEach(div => {
            simulateClick(div);
        });

        document.getElementById('delete-member').onclick = function() {
            if (confirm('Are you sure you want to delete this household member? This action cannot be undone.')) {
                deleteHouseholdMember(member.householdMemberId);
                removeHouseholdMemberFromUI(member.householdMemberId);
                document.getElementById('householdMemberModal').style.display = 'none';
            }
        };
    }

    function setSelectionBox(selector, value) {
        const questionDiv = document.querySelector(selector);
        questionDiv.querySelectorAll('div').forEach(div => div.classList.remove('selected'));
        if (value !== undefined) {
            const selectedDiv = questionDiv.querySelector(`div[data-value="${value}"]`);
            if (selectedDiv) {
                selectedDiv.classList.add('selected');
            }
        }
    }

    function clearSelections() {
        document.querySelectorAll('#householdMemberModal .selection-box div.selected').forEach(div => {
            div.classList.remove('selected');
        });
    }

    document.querySelectorAll('.selection-box div').forEach(div => {
        div.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('div').forEach(sibling => sibling.classList.remove('selected'));
            this.classList.add('selected');
            handleConditionalQuestions(parent.id, this.dataset.value);

            // Save the selection immediately
            const memberId = document.getElementById('householdMemberId').value;
            if (memberId) {
                const member = {
                    householdMemberId: memberId,
                    firstName: document.getElementById('firstName').value,
                    middleInitial: document.getElementById('middleInitial').value,
                    lastName: document.getElementById('lastName').value,
                    dob: document.getElementById('dob').value,
                    maritalStatus: document.getElementById('maritalStatus').value,
                    disability: document.querySelector('#disabilityQuestion div.selected').dataset.value,
                    medicare: document.querySelector('#medicareQuestion div.selected').dataset.value,
                    medicaid: document.querySelector('#medicaidQuestion div.selected').dataset.value,
                    student: document.querySelector('#studentQuestion div.selected').dataset.value,
                    meals: document.querySelector('#mealsQuestion div.selected').dataset.value
                };
                saveHouseholdMember(member);
            }
        });
    });

    function handleConditionalQuestions(questionId, value) {
        if (questionId === 'disability-label' && value === 'yes') {
            document.getElementById('disabilityQuestion').style.display = 'block';
        } else if (questionId === 'disability-label' && value === 'no') {
            document.getElementById('disabilityQuestion').style.display = 'none';
        }
        // Add more conditional logic as needed
    }

    document.getElementById('household-size').addEventListener('change', function() {
        saveSelection('householdSize', this.value);
    });

    document.querySelectorAll('[id^="disability-"], [id^="medicare-"], [id^="medicaid-"], [id^="student-"], [id^="snap-"]').forEach(function(element) {
        element.addEventListener('click', function() {
            saveSelection(this.id.split('-')[0], this.dataset.value);
        });
    });

    const householdSize = loadSelection('householdSize');
    if (householdSize) {
        document.getElementById('household-size').value = householdSize;
    }

    ['disability', 'medicare', 'medicaid', 'student', 'snap'].forEach(function(key) {
        const value = loadSelection(key);
        if (value) {
            simulateClick(document.getElementById(`${key}-${value}`));
        }
    });

    document.querySelectorAll('.selection-box div.selected').forEach(div => {
        simulateClick(div);
    });

    loadHouseholdMembers().forEach(member => {
        addHouseholdMemberToUI(member);
    });

    document.getElementById('householdMemberForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const member = {
            householdMemberId: document.getElementById('householdMemberId').value || generateUniqueId(),
            firstName: document.getElementById('firstName').value,
            middleInitial: document.getElementById('middleInitial').value,
            lastName: document.getElementById('lastName').value,
            dob: document.getElementById('dob').value,
            maritalStatus: document.getElementById('maritalStatus').value,
            disability: document.querySelector('#disabilityQuestion div[data-value="yes"]').classList.contains('selected') ? 'yes' : 'no',
            medicare: document.querySelector('#medicareQuestion div[data-value="yes"]').classList.contains('selected') ? 'yes' : 'no',
            medicaid: document.querySelector('#medicaidQuestion div[data-value="yes"]').classList.contains('selected') ? 'yes' : 'no',
            student: document.querySelector('#studentQuestion div[data-value="yes"]').classList.contains('selected') ? 'yes' : 'no',
            meals: document.querySelector('#mealsQuestion div[data-value="yes"]').classList.contains('selected') ? 'yes' : 'no'
        };
        saveHouseholdMember(member);
        if (document.getElementById('householdMemberId').value) {
            updateHouseholdMemberInUI(member);
        } else {
            addHouseholdMemberToUI(member);
        }
        document.getElementById('householdMemberForm').reset();
        document.getElementById('householdMemberModal').style.display = 'none';
        refreshHouseholdMembersUI();
    });

    document.getElementById('add-household-member').addEventListener('click', function() {
        const currentHouseholdMembers = loadHouseholdMembers().length;
        const householdSize = parseInt(document.getElementById('household-size').value, 10);

        if (currentHouseholdMembers >= householdSize) {
            alert('You cannot add more household members than the selected household size.');
            return;
        }

        document.getElementById('householdMemberModalTitle').innerText = 'Add Household Member';
        document.getElementById('add-member').style.display = 'block';
        document.getElementById('save-update').style.display = 'none';
        document.getElementById('delete-member').style.display = 'none';
        document.getElementById('householdMemberModal').style.display = 'block';
        document.getElementById('householdMemberForm').reset();
        clearSelections(); // Add this line to clear selections
    });

    document.getElementById('closeHouseholdMemberModal').addEventListener('click', function() {
        document.getElementById('householdMemberModal').style.display = 'none';
    });

    // Add the Primary Client button to the UI
    const primaryClientButton = document.createElement('button');
    primaryClientButton.id = 'set-primary-client';
    primaryClientButton.innerText = 'Add Primary Client as Household Member';
    document.body.appendChild(primaryClientButton);

    primaryClientButton.addEventListener('click', function() {
        const currentHouseholdMembers = loadHouseholdMembers().length;
        const householdSize = parseInt(document.getElementById('household-size').value, 10);

        if (currentHouseholdMembers >= householdSize) {
            alert('You cannot add more household members than the selected household size.');
            return;
        }

        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);

        if (client) {
            document.getElementById('householdMemberModalTitle').innerText = 'Add Household Member';
            document.getElementById('add-member').style.display = 'block';
            document.getElementById('save-update').style.display = 'none';
            document.getElementById('delete-member').style.display = 'none';
            document.getElementById('householdMemberModal').style.display = 'block';
            document.getElementById('householdMemberForm').reset();
            clearSelections();

            // Autofill the client's first name and last name
            document.getElementById('firstName').value = client.firstName;
            document.getElementById('lastName').value = client.lastName;
        }
    });

    function checkPrimaryClientButtonVisibility() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const householdMembers = loadHouseholdMembers();
            const primaryClientExists = householdMembers.some(member => member.firstName === client.firstName && member.lastName === client.lastName);
            if (primaryClientExists) {
                primaryClientButton.style.display = 'none';
            } else {
                primaryClientButton.style.display = 'block';
            }
        }
    }

    // Initial check for Primary Client button visibility
    checkPrimaryClientButtonVisibility();
});

function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

function simulateClick(element) {
    if (element) {
        element.click();
    }
}




function saveResidenceStatus(status) {
    const clientId = getQueryParameter('id');
    if (!clientId) {
        console.error('Client ID not found in query parameters.');
        return;
    }

    // Retrieve existing clients data from local storage
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    let client = clients.find(c => c.id === clientId);

    // If the client doesn't exist, create a new one
    if (!client) {
        client = { id: clientId, householdMembers: [] };
        clients.push(client);
    }

    // Update the residence status for the specific client
    client.residenceStatus = status;

    // If residence status is "other," update PTTR for all household members
    if (status === "other" && client.householdMembers) {
        client.householdMembers.forEach(member => {
            // Overwrite the value unconditionally
            member['Has this person already applied for PTTR this year?'] = 'notinterested';
        });
        localStorage.setItem('clients', JSON.stringify(clients));
console.log('Saved clients to localStorage:', clients); // Debugging log
    }

    // Save the updated clients data back to local storage
    localStorage.setItem('clients', JSON.stringify(clients));
    console.log(`Residence status "${status}" saved for client ID: ${clientId}`);

    // Refresh the UI to reflect the changes
    refreshHouseholdMembersUI();
}