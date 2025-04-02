document.addEventListener('DOMContentLoaded', function () {
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

    const processedMembers = new Set();

    function addHouseholdMemberToUI(member) {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        let memberDiv = document.querySelector(`.household-member[data-id="${member.householdMemberId}"]`);

        if (!memberDiv) {
            memberDiv = document.createElement('div');
            memberDiv.classList.add('household-member');
            memberDiv.setAttribute('data-id', member.householdMemberId);
            householdMemberContainer.appendChild(memberDiv);
        }

        const dob = new Date(member.dob);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        memberDiv.innerHTML = `
            <p>Name: ${member.firstName} ${member.middleInitial} ${member.lastName}</p>
            <p>Date of Birth: ${member.dob}</p>
            <p>Age: ${age}</p>
        `;

        memberDiv.querySelectorAll('button').forEach(button => button.remove());

        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === getQueryParameter('id'));
        let showCurrentYearIncome = true;
        let showPreviousYearIncome = true;

        if (client && client.householdMembers) {
            const relatedMember = client.householdMembers.find(m => {
                return m.relationships && m.relationships[member.householdMemberId] === 'spouse';
            });
        
            if (relatedMember) {
                const bothNoLIS = member["Is this person currently enrolled in LIS?"] !== 'no' && relatedMember['Is this person currently enrolled in LIS?'] !== 'no';
                const bothNoMSP = member['Is this person currently enrolled in MSP?'] !== 'no' && relatedMember['Is this person currently enrolled in MSP?'] !== 'no';
                const neitherMealsYes = member.meals !== 'yes' && relatedMember.meals !== 'yes';
        
                if (neitherMealsYes && bothNoLIS && bothNoMSP) {
                    showCurrentYearIncome = false;
                }
        
                const bothNoPTTR = member["Has this person already applied for PTTR this year?"] !== 'no' && relatedMember["Has this person already applied for PTTR this year?"] !== 'no';
                const bothNoPACE = member["Is this person currently enrolled in PACE?"] !== 'no' && relatedMember["Is this person currently enrolled in PACE?"] !== 'no';
        
                if (bothNoPTTR && bothNoPACE) {
                    showPreviousYearIncome = false;
                }
            } else {
                // Check conditions for the member themselves if no spouse is found
                const noLIS = member["Is this person currently enrolled in LIS?"] !== 'no';
                const noMSP = member["Is this person currently enrolled in MSP?"] !== 'no';
                const noMeals = member.meals !== 'yes';
        
                if (noMeals && noLIS && noMSP) {
                    showCurrentYearIncome = false;
                }
        
                const noPTTR = member["Has this person already applied for PTTR this year?"] !== 'no';
                const noPACE = member["Is this person currently enrolled in PACE?"] !== 'no';
        
                if (noPTTR && noPACE) {
                    showPreviousYearIncome = false;
                }
            }
        }

        if (showCurrentYearIncome) {
            const addCurrentYearIncomeButton = document.createElement('button');
            addCurrentYearIncomeButton.innerText = 'Add Current Year Income';
            addCurrentYearIncomeButton.addEventListener('click', function () {
                addIncome(member.householdMemberId, 'Current');
            });
            memberDiv.appendChild(addCurrentYearIncomeButton);
        }

        if (showPreviousYearIncome) {
            const addPreviousYearIncomeButton = document.createElement('button');
            addPreviousYearIncomeButton.innerText = 'Add Previous Year Income';
            addPreviousYearIncomeButton.addEventListener('click', function () {
                addIncome(member.householdMemberId, 'Previous');
            });
            memberDiv.appendChild(addPreviousYearIncomeButton);
        }

        if (member.incomes && member.incomes.length > 0) {
            member.incomes.forEach(income => {
                addIncomeToUI(member.householdMemberId, income);
            });
        }

        if (client && client.householdMembers) {
            const relatedMember = client.householdMembers.find(m => {
                return m.relationships && m.relationships[member.householdMemberId] === 'spouse';
            });

            if (relatedMember && !processedMembers.has(relatedMember.householdMemberId)) {
                processedMembers.add(relatedMember.householdMemberId);
                addHouseholdMemberToUI(relatedMember);
            }
        }
    }

    function refreshHouseholdMembersUI() {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        householdMemberContainer.innerHTML = '';
        const members = loadHouseholdMembers();
        members.forEach(member => {
            addHouseholdMemberToUI(member);
        });
    }

    function addIncomeToUI(householdMemberId, income) {
        const memberDiv = document.querySelector(`.household-member[data-id="${householdMemberId}"]`);
        if (memberDiv) {
            const incomeDiv = document.createElement('div');
            incomeDiv.classList.add('income');
            incomeDiv.style.border = '1px solid #ccc';
            incomeDiv.style.padding = '10px';
            incomeDiv.style.margin = '10px 0';
            incomeDiv.style.display = 'flex';
            incomeDiv.style.flexWrap = 'wrap';
            incomeDiv.style.justifyContent = 'space-between';
            incomeDiv.innerHTML = `
                <p style="flex: 1;">Income Year: ${income.yearType}</p>
                <p style="flex: 1;">Income Type: ${income.kind}</p>
                <p style="flex: 1;">Start Date: ${income.startDate}</p>
                <p style="flex: 1;">End Date: ${income.endDate}</p>
                <p style="flex: 1;">Frequency: ${income.frequency}</p>
                <p style="flex: 1;">Amount: ${income.amount}</p>
                <button class="edit-income" data-id="${income.incomeId}" style="flex: 1;">Edit</button>
                <button class="delete-income" data-id="${income.incomeId}" style="flex: 1;">X</button>
            `;
            memberDiv.appendChild(incomeDiv);

            incomeDiv.querySelector('.delete-income').addEventListener('click', function () {
                deleteIncome(householdMemberId, income.incomeId);
            });

            incomeDiv.querySelector('.edit-income').addEventListener('click', function () {
                editIncome(householdMemberId, income.incomeId);
            });
        }
    }

    refreshHouseholdMembersUI();

    function addIncome(householdMemberId, yearType) {
        // Show the income modal
        const incomeModal = document.getElementById('incomeModal');
        incomeModal.style.display = 'block';
    
        // Clear the form fields
        document.getElementById('incomeKind').value = '';
        document.getElementById('incomeStartDate').value = '';
        document.getElementById('incomeEndDate').value = '';
        document.getElementById('incomeFrequency').value = '';
        document.getElementById('incomeAmount').value = '';
    
        // Get today's date in YYYY-MM-DD format
        const Today = new Date().toISOString().split('T')[0];
    
        // Autofill start and end dates based on year type
        if (yearType === 'Previous') {
            document.getElementById('incomeStartDate').value = '2024-01-01';
            document.getElementById('incomeEndDate').value = '2024-12-31';
        } else if (yearType === 'Current') {
            const incomeEndDateInput = document.getElementById('incomeEndDate');
incomeEndDateInput.type = 'date'; // Set input type to date
incomeEndDateInput.value = new Date().toISOString().split('T')[0]; // Default to today's date
            incomeEndDateInput.addEventListener('click', function() {
                incomeEndDateInput.type = 'date'; // Change input type to date on click
            }, { once: true }); // Ensure the event listener is only triggered once
        }
    
        // Set the form submission handler
        const incomeForm = document.getElementById('incomeForm');
        incomeForm.onsubmit = function(event) {
            event.preventDefault();
    
            const incomeId = generateUniqueId();
            const income = {
                incomeId: incomeId,
                yearType: yearType,
                kind: document.getElementById('incomeKind').value,
                startDate: document.getElementById('incomeStartDate').value,
                endDate: document.getElementById('incomeEndDate').value,
                frequency: document.getElementById('incomeFrequency').value,
                amount: document.getElementById('incomeAmount').value
            };
    
            const clients = JSON.parse(localStorage.getItem('clients')) || [];
            let client = clients.find(c => c.id === clientId) || { id: clientId, householdMembers: [] };
            if (!clients.includes(client)) clients.push(client);
            client.householdMembers = client.householdMembers || [];
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
            if (member) {
                member.incomes = member.incomes || [];
                member.incomes.push(income);
                localStorage.setItem('clients', JSON.stringify(clients));
                addIncomeToUI(householdMemberId, income);
            }
    
            // Hide the income modal
            incomeModal.style.display = 'none';
        };
    }

    function addIncomeToUI(householdMemberId, income) {
        const memberDiv = document.querySelector(`.household-member[data-id="${householdMemberId}"]`);
        if (memberDiv) {
            const incomeDiv = document.createElement('div');
            incomeDiv.classList.add('income');
            incomeDiv.style.border = '1px solid #ccc';
            incomeDiv.style.padding = '10px';
            incomeDiv.style.margin = '10px 0';
            incomeDiv.style.display = 'flex';
            incomeDiv.style.flexWrap = 'wrap';
            incomeDiv.style.justifyContent = 'space-between';
            incomeDiv.innerHTML = `
                <p style="flex: 1;">Income Year: ${income.yearType}</p>
                <p style="flex: 1;">Income Type: ${income.kind}</p>
                <p style="flex: 1;">Start Date: ${income.startDate}</p>
                <p style="flex: 1;">End Date: ${income.endDate}</p>
                <p style="flex: 1;">Frequency: ${income.frequency}</p>
                <p style="flex: 1;">Amount: ${income.amount}</p>
                <button class="edit-income" data-id="${income.incomeId}" style="flex: 1;">Edit</button>
                <button class="delete-income" data-id="${income.incomeId}" style="flex: 1;">X</button>
            `;
            memberDiv.appendChild(incomeDiv);

            // Add event listener for the delete button
            incomeDiv.querySelector('.delete-income').addEventListener('click', function() {
                deleteIncome(householdMemberId, income.incomeId);
            });

            // Add event listener for the edit button
            incomeDiv.querySelector('.edit-income').addEventListener('click', function() {
                editIncome(householdMemberId, income.incomeId);
            });
        }
    }

    function editIncome(householdMemberId, incomeId) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId);
        if (client && client.householdMembers) {
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
            if (member && member.incomes) {
                const income = member.incomes.find(i => i.incomeId === incomeId);
                if (income) {
                    // Populate the form with the existing income data
                    document.getElementById('incomeKind').value = income.kind;
                    document.getElementById('incomeStartDate').value = income.startDate;
                    document.getElementById('incomeEndDate').value = income.endDate;
                    document.getElementById('incomeFrequency').value = income.frequency;
                    document.getElementById('incomeAmount').value = income.amount;

                    // Show the income modal
                    const incomeModal = document.getElementById('incomeModal');
                    incomeModal.style.display = 'block';

                    // Set the form submission handler for updating the income
                    const incomeForm = document.getElementById('incomeForm');
                    incomeForm.onsubmit = function(event) {
                        event.preventDefault();

                        // Update the income data
                        income.kind = document.getElementById('incomeKind').value;
                        income.startDate = document.getElementById('incomeStartDate').value;
                        income.endDate = document.getElementById('incomeEndDate').value;
                        income.frequency = document.getElementById('incomeFrequency').value;
                        income.amount = document.getElementById('incomeAmount').value;

                        // Save the updated clients data to localStorage
                        localStorage.setItem('clients', JSON.stringify(clients));

                        // Refresh the UI
                        refreshHouseholdMembersUI();

                        // Hide the income modal
                        incomeModal.style.display = 'none';
                    };
                }
            }
        }
    }

    function deleteIncome(householdMemberId, incomeId) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        let client = clients.find(c => c.id === clientId);
        if (client && client.householdMembers) {
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
            if (member && member.incomes) {
                member.incomes = member.incomes.filter(i => i.incomeId !== incomeId);
                localStorage.setItem('clients', JSON.stringify(clients));
                refreshHouseholdMembersUI();
            }
        }
    }

    function updateHouseholdMemberInUI(member) {
        const memberDiv = document.querySelector(`.household-member[data-id="${member.householdMemberId}"]`);
        if (memberDiv) {
            memberDiv.innerHTML = `
                <p>Name: ${member.firstName} ${member.middleInitial} ${member.lastName}</p>
                <p>Date of Birth: ${member.dob}</p>
            `;
        }
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

    function handleConditionalQuestions(questionId, value) {
        if (questionId === 'disability-label' && value === 'yes') {
            document.getElementById('disabilityQuestion').style.display = 'block';
        } else if (questionId === 'disability-label' && value === 'no') {
            document.getElementById('disabilityQuestion').style.display = 'none';
        }
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
    document.getElementById('delete-member').addEventListener('click', function() {
        const memberId = document.getElementById('householdMemberId').value;
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

document.addEventListener('DOMContentLoaded', function() {
    const clientId = getQueryParameter('id');

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modalOverlay';
    document.body.appendChild(modalOverlay);

    
            });

            
