//TODO: icons

let currentChatURL;
let currentChatTitle;
let parentNode;
let chatHistoryContainer;
//let injected = false; // Add a flag to track the injection status

function addUnlockButton() {
  const existingUnlockButton = document.getElementById("unlockButton");

  if (existingUnlockButton) {
    console.log("unlock button already added");
    return;
  }
  const nav = document.querySelector("nav");
  let clearConversationBtn = null;

  if (nav) {
    const links = nav.querySelectorAll("a");

    links.forEach((link) => {
      if (link.textContent.trim() === "Clear conversations") {
        clearConversationBtn = link;
      }
    });

    if (clearConversationBtn) {
      const unlockButton = document.createElement("button");
      unlockButton.id = "unlockButton";
      unlockButton.className = "locked";
      unlockButton.textContent = "Unlock";
      unlockButton.style.position = "absolute";
      unlockButton.style.top = clearConversationBtn.getBoundingClientRect().top - 6 + "px";
      unlockButton.style.left = clearConversationBtn.getBoundingClientRect().left - 6 + "px";
      unlockButton.style.width = clearConversationBtn.getBoundingClientRect().width + 12 + "px";
      unlockButton.style.height = clearConversationBtn.getBoundingClientRect().height + 6 + "px";
      unlockButton.style.zIndex = "9999";
      clearConversationBtn.parentNode.insertBefore(unlockButton, clearConversationBtn);

      unlockButton.addEventListener("click", () => {
        let countdown = 2;
        unlockButton.classList.add("clicked");
        unlockButton.textContent = "Unlock in 3";
        const unlockCountdownInterval = setInterval(() => {
          unlockButton.textContent = `Unlock in ${countdown}`;
          countdown--;

          if (countdown < 0) {
            clearInterval(unlockCountdownInterval);
            unlockButton.textContent = `Unlock`;
            unlockButton.classList.remove("clicked");
            unlockButton.style.display = "none";
            showToast('"Clear conversations" will be locked in 5 secs');
          }
        }, 1000);

        setTimeout(() => {
          showToast(`"Clear conversations" locked by PinMyChat`);
          unlockButton.style.display = "block";
        }, 8000);
      });
    }
  }
}

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
  const noChatMessageCreated = document.querySelector('#no-chat-message-container');
  if (currentChatCreated || noChatMessageCreated) {
    return;
  }

  const buttons = document.querySelector('nav > div > div > a > div.absolute.flex.right-1');

  if (buttons) {
    currentChatTitle = buttons.parentNode.querySelector('div.flex-1.text-ellipsis').textContent;
    currentChatURL = window.location.href;
  } else {
    currentChatURL = window.location.href;
  }
  
  chrome.storage.sync.get('pinnedChats', (data) => {
    const pinnedChats = data.pinnedChats || [];

    // Check if the current chat is already in the pinned chat list
    const isCurrentChatPinned = pinnedChats.some(chat => chat.url === currentChatURL);
    if (!isCurrentChatPinned){
      const currentChat = document.createElement('div');
      currentChat.id = 'current-chat';
      const title = document.createElement('div');
      title.id = 'current-chat-title';
      title.textContent = currentChatTitle;
      currentChat.appendChild(title);

      if (/^https:\/\/chat\.openai\.com\/chat\/[a-z0-9\-]+$/i.test(currentChatURL)) {
        const pinIcon = document.createElement('button');
        pinIcon.className = 'pin-button';
        pinIcon.id = 'pin-button-created';
        pinIcon.textContent = 'Pin';
        pinIcon.addEventListener('click', pinChat);
        currentChat.appendChild(pinIcon);
      } else {
        const noChatMessageContainer = document.createElement('div');
        noChatMessageContainer.id = 'no-chat-message-container';
        const noChatMessage = document.createElement('div');
        noChatMessage.id = 'no-chat-message';
        noChatMessage.textContent = "A new chat detected, refresh the page to pin it.";
        noChatMessageContainer.appendChild(noChatMessage);
        parent.appendChild(noChatMessageContainer);
        return;
      }

      parent.appendChild(currentChat);
      if (buttons){
        scrollToTop(buttons.parentNode,chatHistoryContainer);
      }
    }
  });
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

    // Add expand/collapse button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Collapse Pinned Chats';
    toggleButton.classList.add('toggle-button');
    pinnedChatsList.parentNode.insertBefore(toggleButton, pinnedChatsList);

    toggleButton.addEventListener('click', () => {
      if (pinnedChatsList.classList.contains('collapsed')) {
        pinnedChatsList.classList.remove('collapsed');
        pinnedChatsList.classList.add('expanded');
        toggleButton.textContent = 'Collapse Pinned Chats';
      } else {
        pinnedChatsList.classList.remove('expanded');
        pinnedChatsList.classList.add('collapsed');
        toggleButton.textContent = 'Expand Pinned Chats';
      }
    });
    
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
    // if (injected) {
    //   observer.disconnect(); // Disconnect the observer if the required elements have been injected
    //   return;
    // }
    for (let mutation of mutations) {
      const target = mutation.target;
      if (target.tagName === 'NAV' || target.tagName === 'MAIN') {
        setTimeout(() => {
          // Add the "unlock" button when the page loads
          addUnlockButton();
          injectPinnedChats();
          injectCurrentChat(parentNode);
        }, 500);
        break;
      }
    }
  });

  observer.observe(body, { childList: true, subtree: true });
}


window.addEventListener('load', () => {
  //injected = false;
  // Add the "unlock" button when the page loads
  addUnlockButton();
  injectPinnedChats();
  injectCurrentChat(parentNode);
  observeChange();
});