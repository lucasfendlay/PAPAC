// Move generateUniqueId to the top level of the script
function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

// Move getQueryParameter to the top level of the script
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

document.addEventListener('DOMContentLoaded', function () {
    const clientId = getQueryParameter('id');

    function loadHouseholdMembers() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        return client ? client.householdMembers || [] : [];
    }

    function refreshHouseholdMembersUI() {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        householdMemberContainer.innerHTML = ''; // Clear the container

        const members = loadHouseholdMembers(); // Load all household members
        members.forEach(member => {
            addHouseholdMemberToUI(member); // Add each member and their expenses to the UI

            // Refresh all expense types for the member
            if (member.shelterExpenses) {
                member.shelterExpenses.forEach(expense => addExpenseToUI('shelter', member.householdMemberId, expense));
            }
            if (member.utilityExpenses) {
                member.utilityExpenses.forEach(expense => addExpenseToUI('utility', member.householdMemberId, expense));
            }
            if (member.medicalExpenses) {
                member.medicalExpenses.forEach(expense => addExpenseToUI('medical', member.householdMemberId, expense));
            }
            if (member.otherExpenses) {
                member.otherExpenses.forEach(expense => addExpenseToUI('other', member.householdMemberId, expense));
            }
            if (member.previousYearExpenses) {
                member.previousYearExpenses.forEach(expense => addExpenseToUI('previousYear', member.householdMemberId, expense));
            }
        });
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
        `;
    
        let hasContent = false; // Track if any buttons or expenses are added
    
        // Show Shelter, Utility, and Other Expense buttons only if "meals" is "yes"
        if (member.meals === "yes") {
            const addShelterExpenseButton = createAddExpenseButton('Add Shelter Expense', () => {
                openExpenseModal('shelter', member.householdMemberId);
            });
            memberDiv.appendChild(addShelterExpenseButton);
            hasContent = true;
    
            const addUtilityExpenseButton = createAddExpenseButton('Add Utility Expense', () => {
                openExpenseModal('utility', member.householdMemberId);
            });
            memberDiv.appendChild(addUtilityExpenseButton);
            hasContent = true;
    
            const addOtherExpenseButton = createAddExpenseButton('Add Other Expense', () => {
                openExpenseModal('other', member.householdMemberId);
            });
            memberDiv.appendChild(addOtherExpenseButton);
            hasContent = true;
        }
    
        // Show Medical Expense button based on conditions
        if (
            (member.meals === "yes" && (age >= 60 || member.disability === "yes")) ||
            (age >= 65 && member.medicaid && member["Is this person currently enrolled in PACE?"] === "no") ||
            (member['Is this person currently enrolled in MSP?'] === "no")
        ) {
            const addMedicalExpenseButton = createAddExpenseButton('Add Medical Expense', () => {
                openExpenseModal('medical', member.householdMemberId);
            });
            memberDiv.appendChild(addMedicalExpenseButton);
            hasContent = true;
        }
    
        // Show Previous Year Expense button only if "Has this person already applied for PTTR this year?" is "no"
        if (member["Has this person already applied for PTTR this year?"] === "no") {
            const addPreviousYearExpenseButton = createAddExpenseButton('Add Previous Year Expense', () => {
                openExpenseModal('previousYear', member.householdMemberId);
            });
            memberDiv.appendChild(addPreviousYearExpenseButton);
            hasContent = true;
        }
    
        // Add existing expenses to the UI
        ['shelter', 'utility', 'medical', 'other', 'previousYear'].forEach(type => {
            if (member[`${type}Expenses`]) {
                member[`${type}Expenses`].forEach(expense => addExpenseToUI(type, member.householdMemberId, expense));
                hasContent = true;
            }
        });
    
        // Apply grayed-out style if no content was added
        if (!hasContent) {
            memberDiv.classList.add('grayed-out');
        }
    
        householdMemberContainer.appendChild(memberDiv);
    }
    
    // Add CSS for the grayed-out style
    const style = document.createElement('style');
    style.textContent = `
        .grayed-out {
            opacity: 0.5;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    function createAddExpenseButton(label, onClick) {
        const button = document.createElement('button');
        button.innerText = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function addExpenseToUI(type, householdMemberId, expense) {
        const memberDiv = document.querySelector(`.household-member[data-id="${householdMemberId}"]`);
        if (memberDiv) {
            let expenseContainer;
    
            // Check if a container for utility expenses already exists
            if (type === 'utility') {
                expenseContainer = memberDiv.querySelector('.utility-expenses-container');
                if (!expenseContainer) {
                    // Create a container for utility expenses if it doesn't exist
                    expenseContainer = document.createElement('div');
                    expenseContainer.classList.add('utility-expenses-container');
                    expenseContainer.style.border = '1px solid #ccc';
                    expenseContainer.style.padding = '10px';
                    expenseContainer.style.margin = '10px 0';
                    expenseContainer.style.borderRadius = '5px';
                    expenseContainer.style.backgroundColor = '#fff';
    
                    expenseContainer.innerHTML = `
                        <h4>Utility Expenses</h4>
                        <div class="utility-expense-list" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="edit-utility-expense">Edit</button>
                            <button class="delete-utility-expense">Delete</button>
                        </div>
                    `;
                    memberDiv.appendChild(expenseContainer);
    
                    // Style the "Edit" button
                    const editButton = expenseContainer.querySelector('.edit-utility-expense');
                    editButton.style.padding = '5px 10px';
                    editButton.style.border = 'none';
                    editButton.style.borderRadius = '3px';
                    editButton.style.backgroundColor = '#007bff';
                    editButton.style.color = 'white';
                    editButton.style.cursor = 'pointer';
    
                    // Style the "Delete" button
                    const deleteButton = expenseContainer.querySelector('.delete-utility-expense');
                    deleteButton.style.padding = '5px 10px';
                    deleteButton.style.border = 'none';
                    deleteButton.style.borderRadius = '3px';
                    deleteButton.style.backgroundColor = '#dc3545';
                    deleteButton.style.color = 'white';
                    deleteButton.style.cursor = 'pointer';
    
                    // Add event listener for the edit button
                    editButton.addEventListener('click', function () {
                        openUtilityExpenseModal(householdMemberId);
                    });
    
                    // Add event listener for the delete button
                    deleteButton.addEventListener('click', function () {
                        if (confirm('Are you sure you want to delete all utility expenses? This action cannot be undone.')) {
                            deleteAllUtilityExpenses(householdMemberId);
                        }
                    });
                }
    
                // Add the utility expense to the list
                const utilityExpenseList = expenseContainer.querySelector('.utility-expense-list');
    
                // Ensure the expense type is valid before creating the item
                if (expense.type && expense.type.trim() !== '') {
                    const expenseItem = document.createElement('div');
                    expenseItem.textContent = `${expense.type}`;
                    expenseItem.style.margin = '5px 0'; // Optional: Add some spacing between items
                    expenseItem.style.padding = '5px';
                    expenseItem.style.border = '1px solid #ccc';
                    expenseItem.style.borderRadius = '3px';
                    expenseItem.style.backgroundColor = '#f8f9fa'; // Optional: Light background for better visibility
                    expenseItem.style.flex = '1 1 auto'; // Allow items to grow and shrink
                    expenseItem.style.maxWidth = '150px'; // Optional: Limit the width of each item
                    expenseItem.style.textAlign = 'center'; // Center the text
                    utilityExpenseList.appendChild(expenseItem);
                }
            } else {
                expenseContainer = document.createElement('div');
                expenseContainer.classList.add('expense');
                expenseContainer.style.display = 'flex';
                expenseContainer.style.justifyContent = 'space-between';
                expenseContainer.style.alignItems = 'center';
                expenseContainer.style.padding = '10px';
                expenseContainer.style.margin = '10px 0';
                expenseContainer.style.border = '1px solid #ccc';
                expenseContainer.style.borderRadius = '5px';
                expenseContainer.style.backgroundColor = '#fff';
    
                // Create the expense details section
                const expenseDetails = document.createElement('div');
                expenseDetails.style.flex = '1';
                expenseDetails.style.display = 'flex';
                expenseDetails.style.justifyContent = 'space-between';
                expenseDetails.style.gap = '20px';
    
                // Include the frequency in the expense details for medical expenses
                expenseDetails.innerHTML = `
                    <span>${capitalize(type)} Expense Type: ${expense.type}</span>
                    <span>${capitalize(type)} Expense Value: $${!isNaN(parseFloat(expense.value)) ? parseFloat(expense.value).toFixed(2) : 'Invalid Value'}</span>
                    ${type === 'medical' ? `<span>${capitalize(type)} Expense Frequency: ${expense.frequency || 'N/A'}</span>` : ''}
                `;
    
                // Create the buttons section
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.display = 'flex';
                buttonsContainer.style.gap = '10px';
    
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-expense');
                editButton.style.padding = '5px 10px';
                editButton.style.border = 'none';
                editButton.style.borderRadius = '3px';
                editButton.style.backgroundColor = '#007bff';
                editButton.style.color = 'white';
                editButton.style.cursor = 'pointer';
    
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-expense');
                deleteButton.style.padding = '5px 10px';
                deleteButton.style.border = 'none';
                deleteButton.style.borderRadius = '3px';
                deleteButton.style.backgroundColor = '#dc3545';
                deleteButton.style.color = 'white';
                deleteButton.style.cursor = 'pointer';
    
                // Add event listeners for buttons
                editButton.addEventListener('click', () => editExpense(type, householdMemberId, expense));
                deleteButton.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to delete this ${type} expense? This action cannot be undone.`)) {
                        deleteExpense(type, householdMemberId, expense.expenseId);
                    }
                });
    
                // Append buttons to the container
                buttonsContainer.appendChild(editButton);
                buttonsContainer.appendChild(deleteButton);
    
                // Append details and buttons to the expense container
                expenseContainer.appendChild(expenseDetails);
                expenseContainer.appendChild(buttonsContainer);
    
                // Append the expense container to the memberDiv
                memberDiv.appendChild(expenseContainer);
            }
        }
    }

    function editExpense(type, householdMemberId, expense) {
        openExpenseModal(type, householdMemberId, expense);
    }

    function openExpenseModal(type, householdMemberId, expense = null) {
        const modal = document.getElementById(`${type}ExpenseModal`);
        modal.dataset.memberId = householdMemberId;
    
        const modalHeader = document.getElementById(`${type}ExpenseModalHeader`);
        const expenseTypeInput = document.getElementById(`${type}ExpenseType`);
        const expenseValueInput = document.getElementById(`${type}ExpenseValue`);
        const expenseFrequencyInput = document.getElementById(`${type}ExpenseFrequency`); // Frequency dropdown
        const saveButton = document.getElementById(`save${capitalize(type)}ExpenseButton`);
    
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const clientId = getQueryParameter('id');
        const client = clients.find(c => c.id === clientId);
    
        if (client) {
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
    
            if (type === 'medical' && member) {
                // Clear existing options in the Medical Expense dropdown
                expenseTypeInput.innerHTML = '';
    
                if (member.meals === "no") {
                    // Populate only "Medicare Part B" if meals === "no"
                    const option = document.createElement('option');
                    option.value = 'Medicare Part B';
                    option.textContent = 'Medicare Part B';
                    expenseTypeInput.appendChild(option);
                } else {
                    // Populate all medical expense options if meals === "yes"
                    const medicalOptions = [
                        'Doctor Copay',
                        'Prescription Medication',
                        'Over-the-Counter Medication',
                        'Dental Visits',
                        'Eye Exams',
                        'Medical Supplies',
                        'Medical Equipment',
                        'Transportation',
                        'Home Health Aide',
                        'Service Animal',
                        'Other',
                        'Medicare Part B' // Include Medicare Part B as an option
                    ];
    
                    medicalOptions.forEach(optionText => {
                        const option = document.createElement('option');
                        option.value = optionText;
                        option.textContent = optionText;
                        expenseTypeInput.appendChild(option);
                    });
                }
            }
    
            modal.style.display = 'block';
            modalHeader.innerText = expense ? `Edit ${capitalize(type)} Expense` : `Add ${capitalize(type)} Expense`;
    
            // Populate fields if editing
            if (expense) {
                expenseTypeInput.value = expense.type;
                if (expenseValueInput) {
                    expenseValueInput.value = expense.value;
                }
                if (expenseFrequencyInput) {
                    expenseFrequencyInput.value = expense.frequency; // Populate frequency
                }
            } else {
                expenseTypeInput.value = '';
                if (expenseValueInput) {
                    expenseValueInput.value = '';
                }
                if (expenseFrequencyInput) {
                    expenseFrequencyInput.value = ''; // Clear frequency
                }
            }
    
            saveButton.onclick = function () {
                const expenseData = {
                    expenseId: expense ? expense.expenseId : generateUniqueId(),
                    type: expenseTypeInput.value, // Save the selected type
                    value: expenseValueInput ? parseFloat(expenseValueInput.value) : null, // Save value
                    frequency: expenseFrequencyInput ? expenseFrequencyInput.value : '', // Save frequency
                };
            
                // Validate required fields
                if (!expenseData.type || isNaN(expenseData.value) || 
                    (type === 'medical' && !expenseData.frequency)) { // Only validate frequency for medical expenses
                   
                    return;
                }
            
                if (client) {
                    const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
                    if (member) {
                        member[`${type}Expenses`] = member[`${type}Expenses`] || [];
                        if (expense) {
                            // Update existing expense
                            const expenseIndex = member[`${type}Expenses`].findIndex(e => e.expenseId === expense.expenseId);
                            if (expenseIndex !== -1) {
                                member[`${type}Expenses`][expenseIndex] = expenseData;
                            }
                        } else {
                            // Add new expense
                            member[`${type}Expenses`].push(expenseData);
                        }
                        localStorage.setItem('clients', JSON.stringify(clients));
                        refreshHouseholdMembersUI();
                    }
                }
            
                modal.style.display = 'none';
            };
    
            const closeModalButton = document.getElementById(`close${capitalize(type)}ExpenseModal`);
            closeModalButton.onclick = function () {
                modal.style.display = 'none';
            };
        }
    }

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Initialize the UI
    refreshHouseholdMembersUI();
});

document.addEventListener('DOMContentLoaded', () => {
    const utilityOptions = document.querySelectorAll('.selection-option');
    const saveUtilityExpenseButton = document.getElementById('saveUtilityExpenseButton');
    const closeUtilityExpenseModalButton = document.getElementById('closeUtilityExpenseModal');

    // Allow multiple selections and toggle the 'selected' class
    utilityOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
        });
    });

    // Save utility expenses (handles both adding and editing)
    saveUtilityExpenseButton.addEventListener('click', () => {
        const selectedOptions = Array.from(document.querySelectorAll('.selection-option.selected'));
        const utilityExpenses = selectedOptions.map(option => ({
            type: option.dataset.value, // Retrieves the utility type from the data-value attribute
            expenseId: generateUniqueId(),
        }));
    
        const clientId = getQueryParameter('id');
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
    
        if (client) {
            const householdMemberId = document.getElementById('utilityExpenseModal').dataset.memberId;
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
    
            if (member) {
                // Overwrite utilityExpenses array with new data
                member.utilityExpenses = utilityExpenses;
    
                // Save updated data to localStorage
                localStorage.setItem('clients', JSON.stringify(clients));
    
                // Close the modal
                const utilityExpenseModal = document.getElementById('utilityExpenseModal');
                utilityExpenseModal.style.display = 'none';
    
                // Clear selected options in the modal
                utilityOptions.forEach(option => option.classList.remove('selected'));
    
                // Refresh the page to reflect changes
                location.reload();
            } else {
                alert('Household member not found.');
            }
        } else {
            alert('Client not found.');
        }
    });

    // Close the utility expense modal
    closeUtilityExpenseModalButton.addEventListener('click', () => {
        document.getElementById('utilityExpenseModal').style.display = 'none';
    });
});

function openUtilityExpenseModal(householdMemberId) {
    const modal = document.getElementById('utilityExpenseModal');
    modal.dataset.memberId = householdMemberId;

    // Clear all selected options in the modal
    const utilityOptions = document.querySelectorAll('.selection-option');
    utilityOptions.forEach(option => option.classList.remove('selected'));

    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const clientId = getQueryParameter('id');
    const client = clients.find(c => c.id === clientId);

    const modalHeader = document.getElementById('utilityExpenseModalHeader');

    if (client) {
        const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
        if (member && member.utilityExpenses && member.utilityExpenses.length > 0) {
            // Highlight existing utility expenses (only if editing)
            utilityOptions.forEach(option => {
                const isSelected = member.utilityExpenses.some(expense => expense.type === option.dataset.value);
                if (isSelected) {
                    option.classList.add('selected');
                }
            });

            // Set modal header to "Edit Utility Expenses"
            modalHeader.innerText = 'Edit Utility Expenses';
        } else {
            // Set modal header to "Add Utility Expenses"
            modalHeader.innerText = 'Add Utility Expenses';
        }
    }

    modal.style.display = 'block';
    console.log('Utility expense modal opened.');
}

function deleteAllUtilityExpenses(householdMemberId) {
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const clientId = getQueryParameter('id');
    const client = clients.find(c => c.id === clientId);

    if (client) {
        const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
        if (member) {
            // Clear all utility expenses from storage
            member.utilityExpenses = [];
            localStorage.setItem('clients', JSON.stringify(clients));

            // Remove the utility container from the UI
            const memberDiv = document.querySelector(`.household-member[data-id="${householdMemberId}"]`);
            const utilityContainer = memberDiv.querySelector('.utility-expenses-container');
            if (utilityContainer) {
                utilityContainer.remove();
            }

            // Clear the "Add Utility Expense" modal
            const utilityOptions = document.querySelectorAll('.selection-option');
            utilityOptions.forEach(option => option.classList.remove('selected'));
        }
    }
}

function deleteExpense(type, householdMemberId, expenseId) {
    // Retrieve clients from localStorage
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const clientId = getQueryParameter('id');
    const client = clients.find(c => c.id === clientId);

    if (client) {
        const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
        if (member) {
            // Find the expense array for the given type
            const expenseList = member[`${type}Expenses`];
            if (expenseList) {
                // Remove the expense from the array
                const expenseIndex = expenseList.findIndex(expense => expense.expenseId === expenseId);
                if (expenseIndex !== -1) {
                    expenseList.splice(expenseIndex, 1); // Remove the expense
                    localStorage.setItem('clients', JSON.stringify(clients)); // Save updated data
                }
            }
        }
    }

    // Remove the expense from the UI
    const expenseElement = document.querySelector(`.expense[data-id="${expenseId}"]`);
    if (expenseElement) {
        expenseElement.remove();
    }

    // Refresh the page to reflect changes
    location.reload();
}

function selectHeatingCooling(selection) {
    // Get the elements for "Yes" and "No" options
    const heatingYes = document.getElementById('heatingYes');
    const heatingNo = document.getElementById('heatingNo');

    if (!heatingYes || !heatingNo) {
        console.error('Heating options not found in the DOM.');
        return;
    }

    // Ensure only one option is selected at a time
    if (selection === 'Yes') {
        heatingYes.classList.add('selected'); // Add 'selected' to "Yes"
        heatingNo.classList.remove('selected'); // Remove 'selected' from "No"
    } else if (selection === 'No') {
        heatingNo.classList.add('selected'); // Add 'selected' to "No"
        heatingYes.classList.remove('selected'); // Remove 'selected' from "Yes"
    } else {
        console.error('Invalid selection. Expected "Yes" or "No".');
        return;
    }

    // Save the selection into utility expenses for the specific household member
    const clientId = getQueryParameter('id');
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const client = clients.find(c => c.id === clientId);

    if (client) {
        const householdMemberId = document.getElementById('householdMemberId')?.value; // Ensure the element exists
        if (!householdMemberId) {
            console.error('Household member ID not found.');
            return;
        }

        const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);

        if (member) {
            member.utilityExpenses = member.utilityExpenses || [];
            const existingExpenseIndex = member.utilityExpenses.findIndex(expense => expense.type === 'Heating and Cooling');

            if (existingExpenseIndex !== -1) {
                // Update existing expense
                member.utilityExpenses[existingExpenseIndex].value = selection;
            } else {
                // Add new expense
                member.utilityExpenses.push({ type: 'Heating and Cooling', value: selection });
            }

            // Save updated data back to localStorage
            localStorage.setItem('clients', JSON.stringify(clients));
            console.log(`Saved Heating and Cooling expense for member ${member.firstName} ${member.lastName}: ${selection}`);
        } else {
            console.error('Household member not found.');
        }
    } else {
        console.error('Client not found.');
    }
}