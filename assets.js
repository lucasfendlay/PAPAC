document.addEventListener('DOMContentLoaded', function() {
    const clientId = getQueryParameter('id');

    function loadHouseholdMembers() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        return client ? client.householdMembers || [] : [];
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
    
        // Check conditions for adding the "Add Asset" button
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === getQueryParameter('id'));
        let canAddAsset = false;
    
        if (client && client.householdMembers) {
            const relatedMember = client.householdMembers.find(m => {
                return m.relationships && m.relationships[member.householdMemberId] === 'spouse';
            });
    
            if (relatedMember) {
                // If either member meets the conditions, both should have the button
                const eitherMealsYes = member.meals === 'yes' || relatedMember.meals === 'yes';
                const eitherNoLIS = member["Is this person currently enrolled in LIS?"] === 'no' || relatedMember["Is this person currently enrolled in LIS?"] === 'no';
                const eitherNoMSP = member["Is this person currently enrolled in MSP?"] === 'no' || relatedMember["Is this person currently enrolled in MSP?"] === 'no';
                const eitherNoPTTR = member["Has this person already applied for PTTR this year?"] === 'no' || relatedMember["Has this person already applied for PTTR this year?"] === 'no';
    
                if (eitherMealsYes || eitherNoLIS || eitherNoMSP || eitherNoPTTR) {
                    canAddAsset = true;
                }
            } else {
                // Check conditions for the member themselves if no spouse is found
                const mealsYes = member.meals === 'yes';
                const noLIS = member["Is this person currently enrolled in LIS?"] === 'no';
                const noMSP = member["Is this person currently enrolled in MSP?"] === 'no';
                const noPTTR = member["Has this person already applied for PTTR this year?"] === 'no';
    
                if (mealsYes || noLIS || noMSP || noPTTR) {
                    canAddAsset = true;
                }
            }
        }
    
        if (canAddAsset) {
            const addAssetButton = document.createElement('button');
            addAssetButton.innerText = 'Add Asset';
            addAssetButton.addEventListener('click', function () {
                openAssetsModal(member.householdMemberId);
            });
            memberDiv.appendChild(addAssetButton);
        } else {
            memberDiv.classList.add('grayed-out');
        }
    
        // Add existing assets to the UI
        if (member.assets) {
            member.assets.forEach(asset => addAssetToUI(member.householdMemberId, asset));
        }
    
        householdMemberContainer.appendChild(memberDiv);
    }

    function addAssetToUI(householdMemberId, asset) {
        const memberDiv = document.querySelector(`.household-member[data-id="${householdMemberId}"]`);
        if (memberDiv) {
            const assetDiv = document.createElement('div');
            assetDiv.classList.add('asset');
            assetDiv.style.border = '1px solid #ccc';
            assetDiv.style.padding = '10px';
            assetDiv.style.margin = '10px 0';
            assetDiv.style.display = 'flex';
            assetDiv.style.justifyContent = 'space-between';
            assetDiv.innerHTML = `
                <span>Asset Type: ${asset.type}</span>
                <span>Asset Value: ${asset.value}</span>
                <div>
                    <button class="edit-asset">Edit</button>
                    <button class="delete-asset">Delete</button>
                </div>
            `;
    
            // Add event listener for the delete button
            assetDiv.querySelector('.delete-asset').addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
                    deleteAsset(householdMemberId, asset.assetId);
                }
            });
    
            // Add event listener for the edit button
            assetDiv.querySelector('.edit-asset').addEventListener('click', function() {
                editAsset(householdMemberId, asset);
            });
    
            memberDiv.appendChild(assetDiv);
        }
    }

    function deleteAsset(householdMemberId, assetId) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
            if (member) {
                member.assets = member.assets.filter(asset => asset.assetId !== assetId);
                localStorage.setItem('clients', JSON.stringify(clients));
                refreshHouseholdMembersUI();
            }
        }
    }

    function editAsset(householdMemberId, asset) {
        // Open the modal and populate it with the asset data
        const assetsModal = document.getElementById('assetsModal');
        const modalOverlay = document.getElementById('modalOverlay');
        assetsModal.style.display = 'block';
        modalOverlay.style.display = 'block';
    
        // Change the modal header to "Edit Asset"
        document.getElementById('assetModalHeader').innerText = 'Edit Asset';
    
        document.getElementById('assetType').value = asset.type;
        document.getElementById('assetValue').value = asset.value;
    
        const saveAssetButton = document.getElementById('saveAssetButton');
        saveAssetButton.onclick = function() {
            asset.type = document.getElementById('assetType').value;
            asset.value = document.getElementById('assetValue').value;
    
            const clients = JSON.parse(localStorage.getItem('clients')) || [];
            const client = clients.find(c => c.id === clientId);
            if (client) {
                const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
                if (member) {
                    const assetIndex = member.assets.findIndex(a => a.assetId === asset.assetId);
                    if (assetIndex !== -1) {
                        member.assets[assetIndex] = asset;
                        localStorage.setItem('clients', JSON.stringify(clients));
                        refreshHouseholdMembersUI();
                    }
                }
            }
    
            assetsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        };
    }
    
    function openAssetsModal(householdMemberId) {
        const assetsModal = document.getElementById('assetsModal');
        const modalOverlay = document.getElementById('modalOverlay');
        assetsModal.style.display = 'block';
        modalOverlay.style.display = 'block';
    
        // Change the modal header to "Add Asset"
        document.getElementById('assetModalHeader').innerText = 'Add Asset';
    
        // Clear the input fields
        document.getElementById('assetType').value = '';
        document.getElementById('assetValue').value = '';
    
        const saveAssetButton = document.getElementById('saveAssetButton');
        saveAssetButton.onclick = function() {
            const asset = {
                assetId: generateUniqueId(),
                type: document.getElementById('assetType').value,
                value: document.getElementById('assetValue').value
            };
    
            const clients = JSON.parse(localStorage.getItem('clients')) || [];
            const client = clients.find(c => c.id === clientId);
            if (client) {
                const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
                if (member) {
                    member.assets = member.assets || [];
                    member.assets.push(asset);
                    localStorage.setItem('clients', JSON.stringify(clients));
                    addAssetToUI(householdMemberId, asset); // Add the new asset to the UI
                }
            }
    
            assetsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        };
    
        // Add close button to the modal
        const closeModalButton = document.getElementById('closeAssetModal');
        closeModalButton.addEventListener('click', function() {
            assetsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    }

    function refreshHouseholdMembersUI() {
        const householdMemberContainer = document.getElementById('householdMemberContainer');
        householdMemberContainer.innerHTML = '';
        const members = loadHouseholdMembers();
        members.forEach(member => {
            addHouseholdMemberToUI(member);
            // Add existing assets to the UI
            if (member.assets) {
                member.assets.forEach(asset => addAssetToUI(member.householdMemberId, asset));
            }
        });
    }
    document.getElementById('closeAssetModal').addEventListener('click', function() {
        document.getElementById('assetsModal').style.display = 'none';
    });

    function openAssetsModal(householdMemberId) {
        const assetsModal = document.getElementById('assetsModal');
        const modalOverlay = document.getElementById('modalOverlay');
        assetsModal.style.display = 'block';
        modalOverlay.style.display = 'block';

        // Clear the input fields
        document.getElementById('assetType').value = '';
        document.getElementById('assetValue').value = '';

        const saveAssetButton = document.getElementById('saveAssetButton');
        saveAssetButton.onclick = function() {
            const asset = {
                assetId: generateUniqueId(),
                type: document.getElementById('assetType').value,
                value: document.getElementById('assetValue').value
            };

            const clients = JSON.parse(localStorage.getItem('clients')) || [];
            const client = clients.find(c => c.id === clientId);
            if (client) {
                const member = client.householdMembers.find(m => m.householdMemberId === householdMemberId);
                if (member) {
                    member.assets = member.assets || [];
                    member.assets.push(asset);
                    localStorage.setItem('clients', JSON.stringify(clients));
                    addAssetToUI(householdMemberId, asset); // Add the new asset to the UI
                }
            }

            assetsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        };

        // Add close button to the modal
        const closeModalButton = document.getElementById('closeAssetModal');
        closeModalButton.addEventListener('click', function() {
            assetsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    }

    function generateUniqueId() {
        return 'id-' + Math.random().toString(36).substr(2, 16);
    }

    // Call refreshHouseholdMembersUI after DOMContentLoaded
    refreshHouseholdMembersUI();

    // Close the asset modal
    document.getElementById('closeAssetModal').addEventListener('click', function() {
        document.getElementById('assetsModal').style.display = 'none';
        document.getElementById('modalOverlay').style.display = 'none';
    });

    // Create and append the modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modalOverlay';
    document.body.appendChild(modalOverlay);
});

function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}