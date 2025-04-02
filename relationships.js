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
            client.householdMembers[existingMemberIndex] = member;
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
    
        // Get other household members
        const otherMembers = loadHouseholdMembers().filter(m => m.householdMemberId !== member.householdMemberId);
    
        // Separate matching members
        const profileFirstName = document.getElementById('firstName').value;
        const profileLastName = document.getElementById('lastName').value;
        const matchingMembers = otherMembers.filter(m => m.firstName === profileFirstName && m.lastName === profileLastName);
        const nonMatchingMembers = otherMembers.filter(m => m.firstName !== profileFirstName || m.lastName !== profileLastName);
    
        // Generate HTML for matching members
        const matchingMembersHtml = matchingMembers.map(m => {
            const fullName = `<strong>${m.firstName} ${m.middleInitial} ${m.lastName}</strong>`;
            return `
                <div>
                    <p>${fullName}</p>
                    <select class="relationship-dropdown" data-member-id="${m.householdMemberId}">
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            `;
        }).join('');
    
        // Generate HTML for non-matching members
        const nonMatchingMembersHtml = nonMatchingMembers.map(m => {
            const fullName = `<strong>${m.firstName} ${m.middleInitial} ${m.lastName}</strong>`;
            return `
                <div>
                    <p>${fullName}</p>
                    <select class="relationship-dropdown" data-member-id="${m.householdMemberId}">
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="grandchild">Grandchild</option>
                        <option value="aunt/uncle">Aunt/Uncle</option>
                        <option value="niece/nephew">Niece/Nephew</option>
                        <option value="cousin">Cousin</option>
                        <option value="unrelated">Unrelated</option>
                    </select>
                </div>
            `;
        }).join('');
    
        memberDiv.innerHTML = `
            <p>Name: ${member.firstName} ${member.middleInitial} ${member.lastName}</p>
            <p>Date of Birth: ${member.dob}</p>
            <p>Age: ${age}</p>
            <p>Marital Status: ${member.maritalStatus}</p>
            <div>
                <p>Other Household Members:</p>
                ${matchingMembersHtml}
                ${nonMatchingMembersHtml}
            </div>
        `;
        householdMemberContainer.appendChild(memberDiv);
    
        // Add event listeners to the relationship dropdowns
        memberDiv.querySelectorAll('.relationship-dropdown').forEach(dropdown => {
            const relatedMemberId = dropdown.dataset.memberId;
            const savedRelationship = member.relationships ? member.relationships[relatedMemberId] : '';
            dropdown.value = savedRelationship || '';
            dropdown.addEventListener('change', function() {
                const relationship = this.value;
                saveRelationship(member.householdMemberId, relatedMemberId, relationship);
            });
        });
    }

    function saveRelationship(memberId, relatedMemberId, relationship) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId) || { id: clientId, householdMembers: [] };
        if (!clients.includes(client)) clients.push(client);
        client.householdMembers = client.householdMembers || [];
        const member = client.householdMembers.find(m => m.householdMemberId === memberId);
        if (member) {
            member.relationships = member.relationships || {};
            member.relationships[relatedMemberId] = relationship;
            localStorage.setItem('clients', JSON.stringify(clients));
            updateReciprocalRelationship(memberId, relatedMemberId, relationship);
            refreshHouseholdMembersUI();
        }
    }
    
    function updateReciprocalRelationship(memberId, relatedMemberId, relationship) {
        const reciprocalRelationshipMap = {
            'spouse': 'spouse',
            'parent': 'child',
            'child': 'parent',
            'sibling': 'sibling',
            'grandparent': 'grandchild',
            'grandchild': 'grandparent',
            'aunt/uncle': 'niece/nephew',
            'niece/nephew': 'aunt/uncle',
            'cousin': 'cousin',
            'unrelated': 'unrelated'
        };
    
        const reciprocalRelationship = reciprocalRelationshipMap[relationship];
        if (reciprocalRelationship) {
            const clients = JSON.parse(localStorage.getItem('clients')) || [];
            let client = clients.find(c => c.id === clientId) || { id: clientId, householdMembers: [] };
            if (!clients.includes(client)) clients.push(client);
            client.householdMembers = client.householdMembers || [];
            const relatedMember = client.householdMembers.find(m => m.householdMemberId === relatedMemberId);
            if (relatedMember) {
                relatedMember.relationships = relatedMember.relationships || {};
                relatedMember.relationships[memberId] = reciprocalRelationship;
                localStorage.setItem('clients', JSON.stringify(clients));
            }
        }
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
            `;
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
        document.querySelectorAll('.selection-box div.selected').forEach(div => {
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
        document.getElementById('householdMemberModalTitle').innerText = 'Add Household Member';
        document.getElementById('add-member').style.display = 'block';
        document.getElementById('save-update').style.display = 'none';
        document.getElementById('delete-member').style.display = 'none';
        document.getElementById('householdMemberModal').style.display = 'block';
        document.getElementById('householdMemberForm').reset();
    });

    document.getElementById('closeHouseholdMemberModal').addEventListener('click', function() {
        document.getElementById('householdMemberModal').style.display = 'none';
    });
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

// ...existing code...

// Add event listeners to the relationship dropdowns
memberDiv.querySelectorAll('.relationship-dropdown').forEach(dropdown => {
    const relatedMemberId = dropdown.dataset.memberId;
    const savedRelationship = member.relationships ? member.relationships[relatedMemberId] : '';
    dropdown.value = savedRelationship || '';
    dropdown.addEventListener('change', function() {
        const relationship = this.value;
        saveRelationship(member.householdMemberId, relatedMemberId, relationship);
        updateReciprocalRelationship(member.householdMemberId, relatedMemberId, relationship);
        refreshHouseholdMembersUI(); // Refresh the UI after updating relationships
    });
});

// Function to update reciprocal relationship
function updateReciprocalRelationship(memberId, relatedMemberId, relationship) {
    const reciprocalRelationshipMap = {
        'spouse': 'spouse',
        'parent': 'child',
        'child': 'parent',
        'sibling': 'sibling',
        'aunt/uncle': 'niece/nephew',
        'niece/nephew': 'aunt/uncle',
        'cousin': 'cousin',
        'unrelated': 'unrelated'
    };

    const reciprocalRelationship = reciprocalRelationshipMap[relationship];
    if (reciprocalRelationship) {
        saveRelationship(relatedMemberId, memberId, reciprocalRelationship);
    }
}

// Function to save relationship
function saveRelationship(memberId, relatedMemberId, relationship) {
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    let client = clients.find(c => c.id === clientId) || { id: clientId, householdMembers: [] };
    if (!clients.includes(client)) clients.push(client);
    client.householdMembers = client.householdMembers || [];
    const member = client.householdMembers.find(m => m.householdMemberId === memberId);
    if (member) {
        member.relationships = member.relationships || {};
        member.relationships[relatedMemberId] = relationship;
        localStorage.setItem('clients', JSON.stringify(clients));
    }
}

// Function to refresh the UI
function refreshHouseholdMembersUI() {
    const householdMemberContainer = document.getElementById('householdMemberContainer');
    householdMemberContainer.innerHTML = '';
    loadHouseholdMembers().forEach(member => {
        addHouseholdMemberToUI(member);
    });
}

// ...existing code...

// ...existing code...

// ...existing code...