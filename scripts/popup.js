let currentChatURL;
let currentChatTitle;

function displayPinnedChat(pinnedChatsList, url, title, showUnpinButton = true, target) {
    const li = document.createElement('li');
    li.classList.add('chat-item');

    const a = document.createElement('a');
    a.textContent = title;
    a.href = url;
    a.target = target;
    li.appendChild(a);

    if (showUnpinButton) {
        // Create the "Unpin" button
        const unpinButton = document.createElement('button');
        unpinButton.textContent = 'Unpin';
        unpinButton.classList.add('unpin-button');
        unpinButton.addEventListener('click', () => {
            // Remove the item from the list
            li.remove();
            // Remove the item from the storage
            removePinnedChat(url);
        });
        li.appendChild(unpinButton);
    }

    // Prepend the new link to the list
    pinnedChatsList.prepend(li);
}

function showToast(message) {
    const toast = document.getElementById('toast');
  
    if (!toast.classList.contains('visible')) {
      toast.textContent = message;
      toast.classList.add('visible');
  
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 3000); // Adjust the duration as needed
    }
}  
  
function removePinnedChat(urlToRemove) {
    chrome.storage.sync.get('pinnedChats', (data) => {
      const pinnedChats = data.pinnedChats || [];
      const updatedPinnedChats = pinnedChats.filter((chat) => chat.url !== urlToRemove);
  
      chrome.storage.sync.set({ pinnedChats: updatedPinnedChats }, () => {
        console.log('Chat removed from the pinned list');
      });
    });
}

function addPinnedChat() {
  chrome.storage.sync.get('pinnedChats', (data) => {
    let pinnedChats = data.pinnedChats || [];

    // Check if the link is already in the pinnedChats array
    const linkAlreadyPinned = pinnedChats.some(
      (chat) => chat.url === currentChatURL && chat.title === currentChatTitle
    );

    if (!linkAlreadyPinned) {
        // Add the current chat to the pinnedChats array if it's not already there
        pinnedChats.push({ url: currentChatURL, title: currentChatTitle });

        // Save the updated pinnedChats array to the storage
        chrome.storage.sync.set({ pinnedChats: pinnedChats }, () => {
            console.log('Chat pinned');
        });

        // Update the pinned chats list in the popup
        const pinnedChatsList = document.getElementById('pinned-chats');
        displayPinnedChat(pinnedChatsList, currentChatURL, currentChatTitle, currentChatTitle[0], true,'_blank');
        showToast('Chat Pinned');
    } else {
      console.log('Chat already pinned');
      showToast('Chat Already In The Pinned List'); // Show the toast message
    }
  });
}


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  currentChatURL = tab.url;
  currentChatTitle = tab.title;
  const linksList = document.getElementById('links');
  const li = document.createElement('li');

  if (/^https:\/\/chat\.openai\.com\/c\/[^/]+$/i.test(currentChatURL)) {
    const a = document.createElement('a');
    a.textContent = currentChatTitle;
    a.href = currentChatURL;
    a.target = '_blank';

    const button = document.createElement('button');
    button.textContent = 'Pin';
    button.addEventListener('click', addPinnedChat);
    li.appendChild(button);
    li.appendChild(a);

  } else {
    const info = document.createElement('div');
    const subTitle = document.createElement('div');
    info.textContent = "No Chat URL Detected";
    subTitle.textContent = "If it's a new chat, try refresh the page.";
    li.appendChild(info);
    li.appendChild(subTitle);
    console.log('Not a valid chat.openai.com URL');
  }

  linksList.appendChild(li);
});

chrome.storage.sync.get('pinnedChats', (data) => {
    const pinnedChats = data.pinnedChats || [];
    const pinnedChatsList = document.getElementById('pinned-chats');
    for (const chat of pinnedChats) {
        displayPinnedChat(pinnedChatsList, chat.url, chat.title, true , '_blank');
    }
});
