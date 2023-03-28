//TODO: icons

let currentChatURL;
let currentChatTitle;
let parentNode;
let chatHistoryContainer;

function scrollToTop(element, parent) {
  if (element && parent) {
    parent.scrollTop = element.offsetTop - parent.offsetTop;
  } else {
    console.warn("Element or parent not found. Please check their IDs.");
  }
}

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
          showToast('Unpinned');
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
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    chrome.storage.sync.set({ pinnedChats: updatedPinnedChats }, () => {
      console.log('Chat removed from the pinned list');
    });
  });
}

function pinChat() {
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
        const pinnedChatsList = document.getElementById('pinned-chats-container');
        displayPinnedChat(pinnedChatsList, currentChatURL, currentChatTitle, true, '_self');
        showToast('Chat Pinned');
    } else {
      console.log('Chat already pinned');
      showToast('Chat Already In The Pinned List'); // Show the toast message
    }
  });
}

function injectCurrentChat(parent) {
  const currentChatCreated = document.querySelector('#current-chat');
  if (currentChatCreated) {
    return;
  }

  const buttons = document.querySelector('nav > div > div > a > div.absolute.flex.right-1');

  if (buttons) {
    currentChatTitle = buttons.parentNode.querySelector('div.flex-1.text-ellipsis').textContent;
    currentChatURL = window.location.href;
  } else {
    return;
  }
  
  const currentChat = document.createElement('div');
  currentChat.id = 'current-chat';

  if (/^https:\/\/chat\.openai\.com\/chat\/[^/]+$/i.test(currentChatURL)) {
    const title = document.createElement('div');
    title.textContent = currentChatTitle;
    title.id = 'current-chat-title'

    const pinIcon = document.createElement('button');
    pinIcon.className = 'pin-button';
    pinIcon.id = 'pin-button-created';
    pinIcon.textContent = 'Pin';
    pinIcon.addEventListener('click', pinChat);

    currentChat.appendChild(pinIcon);
    currentChat.appendChild(title);
    parent.appendChild(currentChat);
    scrollToTop(buttons.parentNode,chatHistoryContainer)
  } else {
    console.log('Not a valid chat.openai.com URL');
  }
}

function injectPinnedChats() {
  const listCreated = document.querySelector('#pinned-chats-container');
  if (listCreated) {
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className='toast';

  const pinnedChatsList = document.createElement('div');
  pinnedChatsList.id = 'pinned-chats-container';
  pinnedChatsList.className = 'pinned-chats-list';

  const chatHistory = document.querySelector('nav > .flex-col.flex-1.overflow-y-auto');
  if (chatHistory) {
    parentNode = pinnedChatsList;
    chatHistory.parentNode.insertBefore(toast, chatHistory);
    chatHistory.parentNode.insertBefore(pinnedChatsList, chatHistory);
    chatHistoryContainer = chatHistory;
    console.log('Pinned chats container injected.');
  }

  chrome.storage.sync.get('pinnedChats', (data) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    pinnedChatsList.innerHTML = '';
    const pinnedChats = data.pinnedChats || [];
    for (const chat of pinnedChats) {
      displayPinnedChat(pinnedChatsList, chat.url, chat.title, true, '_self');
    }
  });
}

function observeChange() {
  const body = document.querySelector('body');
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      const target = mutation.target;
      if (target.tagName === 'NAV' || target.tagName === 'MAIN') {
        setTimeout(() => {
          injectPinnedChats();
          injectCurrentChat(parentNode);
          //injectPinButton();
        }, 500);
        break;
      }
    }
  });

  observer.observe(body, { childList: true, subtree: true });
}


window.addEventListener('load', () => {
  injectPinnedChats();
  injectCurrentChat(parentNode);
  //injectPinButton();
  observeChange();
});


