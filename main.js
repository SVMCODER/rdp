var firebaseConfig = {
  apiKey: "AIzaSyCOA_2bf_b1o1nXSHZO5Re5DjSD66Pa6MY",
  authDomain: "https://raona0-default-rtdb.firebaseio.com",
  projectId: "raona0",
  storageBucket: "raona0.appspot.com",
  messagingSenderId: "797719983777",
  appId: "1:797719983777:web:d7ffca1316891b51ec62e0"
};


firebase.initializeApp(firebaseConfig);

// Firebase Auth
const auth = firebase.auth();

// Firebase Firestore
const db = firebase.firestore();

// Check if user is logged in
auth.onAuthStateChanged(user => {
  if (user) {
    // User is logged in
    showChatRoom();
  } else {
    // User is not logged in
    showLoginSignup();
  }
});// Sign up form submit
document.getElementById('signup-form').addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const bio = document.getElementById('signup-bio').value.trim();

  if (username === '' || email === '' || password === '' || bio === '') {
    showError('signup-error', 'Please fill in all fields');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;

      // Update user profile with username
      user.updateProfile({
        displayName: username
      });

      // Create a user document in Firestore
      const userDoc = {
        username: username,
        email: email,
        bio: bio
      };

      // Store user data in Firestore
      db.collection('users').doc(user.uid).set(userDoc)
        .then(() => {
          // Clear form fields
          document.getElementById('signup-username').value = '';
          document.getElementById('signup-email').value = '';
          document.getElementById('signup-password').value = '';
          document.getElementById('signup-bio').value = '';

          // Show success message or redirect to another page
          console.log('Sign up successful');
        })
        .catch(error => {
          showError('signup-error', error.message);
        });
    })
    .catch(error => {
      showError('signup-error', error.message);
    });
});

// Login form submit
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;

  if (identifier === '' || password === '') {
    showError('login-error', 'Please enter email/username and password');
    return;
  }

  // Check if identifier is an email or username
  const identifierType = isValidEmail(identifier) ? 'email' : 'username';

  // Find the user based on email or username
  findUser(identifierType, identifier)
    .then(user => {
      if (user) {
        // Authenticate the user with email and password
        auth.signInWithEmailAndPassword(user.email, password)
          .then(() => {
            // Clear form fields
            document.getElementById('login-identifier').value = '';
            document.getElementById('login-password').value = '';

            // Show success message or redirect to another page
            console.log('Login successful');
          })
          .catch(error => {
            showError('login-error', error.message);
          });
      } else {
        showError('login-error', 'User not found');
      }
    })
    .catch(error => {
      showError('login-error', error.message);
    });
});

// Find user by email or username
function findUser(identifierType, identifier) {
  if (identifierType === 'email') {
    return db.collection('users').where('email', '==', identifier).get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          return userDoc;
        } else {
          return null;
        }
      });
  } else if (identifierType === 'username') {
    return db.collection('users').where('username', '==', identifier).get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          return userDoc;
        } else {
          return null;
        }
      });
  }
}

// Display error message
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
}

// Email validation function
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Logout button click
document.getElementById('logout').addEventListener('click', () => {
  auth.signOut();
});

// Show chat room
function showChatRoom() {
  document.getElementById('login-signup').style.display = 'none';
  document.getElementById('chat-room').style.display = 'flex';

  // TODO: Fetch and display room list
  // TODO: Fetch and display messages for the selected room
}

// Show login/signup form
function showLoginSignup() {
  document.getElementById('login-signup').style.display = 'flex';
  document.getElementById('chat-room').style.display = 'none';
}
// Reference to the Firestore collection for messages
const messagesRef = db.collection('messages');

// Message form submit
document.getElementById('message-form').addEventListener('submit', e => {
  e.preventDefault();
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();

  if (message !== '') {
    const user = auth.currentUser;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    // Create a new message object
    const newMessage = {
      content: message,
      senderId: user.uid,
      timestamp: timestamp
    };

    // Add the message to Firestore
    messagesRef.add(newMessage)
      .then(() => {
        // Clear the message input field
        messageInput.value = '';
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
});

// Real-time listener for new messages
messagesRef.orderBy('timestamp').onSnapshot(snapshot => {
  const messageList = document.getElementById('message-list');
  messageList.innerHTML = '';

  snapshot.forEach(doc => {
    const message = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = `${message.content} (Sent by: ${message.senderId})`;
    messageList.appendChild(listItem);
  });
});
// Reference to the Firestore collection for rooms
const roomsRef = db.collection('rooms');


// Create room form submit
document.getElementById('create-room-form').addEventListener('submit', e => {
  e.preventDefault();
  const roomNameInput = document.getElementById('room-name-input');
  const roomName = roomNameInput.value.trim();

  if (roomName !== '') {
    // Create a new room object
    const newRoom = {
      name: roomName
    };

    // Add the room to Firestore
    roomsRef.add(newRoom)
      .then(docRef => {
        // Clear the room name input field
        roomNameInput.value = '';
      })
      .catch(error => {
        console.error('Error creating room:', error);
      });
  }
});

// Send message form submit
document.getElementById('message-form').addEventListener('submit', e => {
  e.preventDefault();
  const messageInput = document.getElementById('message-input');
  const messageContent = messageInput.value.trim();

  if (messageContent !== '') {
    const user = auth.currentUser;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    // Create a new message object
    const newMessage = {
      content: messageContent,
      senderId: user.uid,
      timestamp: timestamp
    };

    // Add the message to Firestore
    messagesRef.add(newMessage)
      .then(() => {
        // Clear the message input field
        messageInput.value = '';
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
});

// Real-time listener for messages
messagesRef.orderBy('timestamp').onSnapshot(snapshot => {
  const messageList = document.getElementById('message-list');
  messageList.innerHTML = '';

  snapshot.forEach(doc => {
    const message = doc.data();

    // Get sender information from Firestore
    getUserInfo(message.senderId)
      .then(userInfo => {
        // Create a list item for the message
        const listItem = document.createElement('li');

        // Create the message content
        const messageContent = document.createElement('p');
        messageContent.textContent = message.content;

        // Create sender details
        const senderDetails = document.createElement('div');
        senderDetails.classList.add('sender-details');

        // Create profile picture
        const profilePic = document.createElement('img');
        profilePic.src = userInfo.profilePicUrl;
        profilePic.alt = 'Profile Picture';

        // Create sender name
        const senderName = document.createElement('span');
        senderName.textContent = userInfo.username;

        // Create message time
        const messageTime = document.createElement('span');
        messageTime.textContent = formatMessageTime(message.timestamp);

        // Append sender details to the list item
        senderDetails.appendChild(profilePic);
        senderDetails.appendChild(senderName);
        senderDetails.appendChild(messageTime);

        // Append message content and sender details to the list item
        listItem.appendChild(messageContent);
        listItem.appendChild(senderDetails);

        // Append the list item to the message list
        messageList.appendChild(listItem);
      })
      .catch(error => {
        console.error('Error getting user information:', error);
      });
  });
});

// Get user information from Firestore
function getUserInfo(userId) {
  return db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userInfo = doc.data();
        return userInfo;
      } else {
        throw new Error('User not found');
      }
    });
}

// Format message timestamp
function formatMessageTime(timestamp) {
  // Implement your desired time formatting logic
  const date = timestamp.toDate();
  const options = { hour: 'numeric', minute: 'numeric' };
  return date.toLocaleString('en-US', options);
}

// Delete room
function deleteRoom(roomId) {
  roomsRef.doc(roomId).delete()
    .then(() => {
      console.log('Room deleted successfully');
    })
    .catch(error => {
      console.error('Error deleting room:', error);
    });
}

// Real-time listener for rooms
roomsRef.onSnapshot(snapshot => {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';

  snapshot.forEach(doc => {
    const room = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = room.name;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteRoom(doc.id);
    });

    listItem.appendChild(deleteButton);
    roomList.appendChild(listItem);
  });
});

// Invite form submit
document.getElementById('invite-form').addEventListener('submit', e => {
  e.preventDefault();
  const inviteEmailInput = document.getElementById('invite-email-input');
  const inviteEmail = inviteEmailInput.value.trim();

  if (inviteEmail !== '') {
    const roomId = getCurrentRoomId(); // Implement a function to get the current room ID

    // Get the room document reference
    const roomRef = roomsRef.doc(roomId);

    // Check if the invited user exists
    checkUserExists(inviteEmail)
      .then(userExists => {
        if (userExists) {
          // Invite the user to the room
          roomRef.update({
            invitations: firebase.firestore.FieldValue.arrayUnion(inviteEmail)
          })
          .then(() => {
            // Clear the invite email input field
            inviteEmailInput.value = '';
          })
          .catch(error => {
            console.error('Error inviting user:', error);
          });
        } else {
          console.error('User does not exist');
        }
      })
      .catch(error => {
        console.error('Error checking user:', error);
      });
  }
});

// Check if a user exists
function checkUserExists(email) {
  return auth.fetchSignInMethodsForEmail(email)
    .then(signInMethods => {
      return signInMethods.length > 0;
    })
    .catch(error => {
      console.error('Error checking user:', error);
      return false;
    });
}

// Real-time listener for rooms
roomsRef.onSnapshot(snapshot => {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';

  snapshot.forEach(doc => {
    const room = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = room.name;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteRoom(doc.id);
    });

    listItem.appendChild(deleteButton);
    roomList.appendChild(listItem);
  });
});
// Create room form submit
document.getElementById('create-room-form').addEventListener('submit', e => {
  e.preventDefault();
  const roomNameInput = document.getElementById('room-name-input');
  const roomName = roomNameInput.value.trim();

  if (roomName !== '') {
    // Create a new room object
    const newRoom = {
      name: roomName
    };

    // Add the room to Firestore
    roomsRef.add(newRoom)
      .then(docRef => {
        // Clear the room name input field
        roomNameInput.value = '';

        // Generate the invitation link with the room ID
        const roomLink = generateRoomLink(docRef.id);

        // Display the invitation link
        console.log('Invitation Link:', roomLink);
      })
      .catch(error => {
        console.error('Error creating room:', error);
      });
  }
});

// Generate invitation link
function generateRoomLink(roomId) {
  const currentURL = window.location.href;
  return `${currentURL}?room=${roomId}`;
}

// Join room from invitation link
function joinRoomFromLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');

  if (roomId) {
    // Join the room with the provided room ID
    console.log('Joining Room:', roomId);

    // Implement logic to join the room
    // e.g., display the messages of the joined room
  }
}

// Invite form submit
document.getElementById('invite-form').addEventListener('submit', e => {
  e.preventDefault();
  const inviteEmailInput = document.getElementById('invite-email-input');
  const inviteEmail = inviteEmailInput.value.trim();

  if (inviteEmail !== '') {
    // Send the invitation email to the provided email address
    sendInvitationEmail(inviteEmail);
    inviteEmailInput.value = '';
  }
});

// Real-time listener for rooms
roomsRef.onSnapshot(snapshot => {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';

  snapshot.forEach(doc => {
    const room = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = room.name;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteRoom(doc.id);
    });

    listItem.appendChild(deleteButton);
    roomList.appendChild(listItem);
  });
});

// Run joinRoomFromLink on page load
joinRoomFromLink();
// Profile form submit
document.getElementById('profile-form').addEventListener('submit', e => {
  e.preventDefault();
  const profilePicInput = document.getElementById('profile-pic-input');
  const usernameInput = document.getElementById('username-input');
  const bioInput = document.getElementById('bio-input');

  const file = profilePicInput.files[0];
  const username = usernameInput.value.trim();
  const bio = bioInput.value.trim();

  if (username === '' || bio === '') {
    showError('profile-error', 'Please fill in all fields');
    return;
  }

  // Update profile picture if a new file is selected
  if (file) {
    updateProfilePicture(file)
      .then(profilePicUrl => {
        updateProfile(username, bio, profilePicUrl);
      })
      .catch(error => {
        showError('profile-error', error.message);
      });
  } else {
    updateProfile(username, bio, null);
  }
});

// Update profile picture
function updateProfilePicture(file) {
  return new Promise((resolve, reject) => {
    const storageRef = storage.ref().child(`profile-pics/${auth.currentUser.uid}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
      snapshot => {
        // Show upload progress if needed
      },
      error => {
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL()
          .then(downloadURL => {
            resolve(downloadURL);
          })
          .catch(error => {
            reject(error);
          });
      }
    );
  });
}

// Update profile data in Firestore
function updateProfile(username, bio, profilePicUrl) {
  const user = auth.currentUser;
  const userDocRef = db.collection('users').doc(user.uid);

  // Update profile data
  userDocRef.update({
    username: username,
    bio: bio,
    profilePicUrl: profilePicUrl
  })
    .then(() => {
      // Clear form fields
      document.getElementById('username-input').value = '';
      document.getElementById('bio-input').value = '';

      // Show success message or perform any other desired action
      console.log('Profile updated successfully');
    })
    .catch(error => {
      showError('profile-error', error.message);
    });
}
// Fetch and display another user's profile
function displayOtherUserProfile(userId) {
  const profilePicElement = document.getElementById('profile-pic');
  const usernameElement = document.getElementById('profile-username');
  const bioElement = document.getElementById('profile-bio');

  // Get the user document from Firestore
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        profilePicElement.src = userData.profilePicUrl;
        usernameElement.textContent = userData.username;
        bioElement.textContent = userData.bio;
      } else {
        console.error('User not found');
      }
    })
    .catch(error => {
      console.error('Error getting user data:', error);
    });
}

// Example usage: Call displayOtherUserProfile(userId) with the desired user ID
// For instance, in a click event listener on a user's profile, you can call:
// displayOtherUserProfile('userId');
// Reference to the Firestore collection for users
const usersRef = db.collection('users');

// Constants for exp and level calculation
const EXP_PER_MESSAGE = 10;
const EXP_LEVEL_FACTOR = 100;

// Send message form submit
document.getElementById('message-form').addEventListener('submit', e => {
  e.preventDefault();
  const messageInput = document.getElementById('message-input');
  const messageContent = messageInput.value.trim();

  if (messageContent !== '') {
    const user = auth.currentUser;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    // Create a new message object
    const newMessage = {
      content: messageContent,
      senderId: user.uid,
      timestamp: timestamp
    };

    // Add the message to Firestore
    messagesRef.add(newMessage)
      .then(() => {
        // Update user's exp in Firestore
        updateExp(user.uid, EXP_PER_MESSAGE)
          .then(() => {
            // Clear the message input field
            messageInput.value = '';
          })
          .catch(error => {
            console.error('Error updating exp:', error);
          });
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
});

// Update user's exp in Firestore and check for level increase
function updateExp(userId, expToAdd) {
  const userRef = usersRef.doc(userId);

  return userRef.get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        const currentExp = userData.exp || 0;
        const newExp = currentExp + expToAdd;
        const currentLevel = userData.level || 1;
        const newLevel = calculateLevel(newExp);

        // Update exp and level in Firestore
        return userRef.update({
          exp: newExp,
          level: newLevel
        })
          .then(() => {
            // Display updated exp and level
            displayExpAndLevel(newExp, newLevel);
          });
      } else {
        throw new Error('User not found');
      }
    });
}

// Calculate level based on exp
function calculateLevel(exp) {
  return Math.floor(exp / EXP_LEVEL_FACTOR) + 1;
}

// Display user's exp and level
function displayExpAndLevel(exp, level) {
  const expElement = document.getElementById('profile-exp');
  const levelElement = document.getElementById('profile-level');

  expElement.textContent = `Exp: ${exp}`;
  levelElement.textContent = `Level: ${level}`;
}


// Send message form submit
document.getElementById('message-form').addEventListener('submit', e => {
  // Existing code to send a message
});

// Update user's exp in Firestore and check for level increase
function updateExp(userId, expToAdd) {
  // Existing code to update user's exp
}

// Calculate level based on exp
function calculateLevel(exp) {
  // Existing code to calculate level
}

// Display user's exp and level
function displayExpAndLevel(exp, level) {
  // Existing code to display exp and level
}

// Fetch and display another user's profile
function displayOtherUserProfile(userId) {
  const profilePicElement = document.getElementById('profile-pic');
  const usernameElement = document.getElementById('profile-username');
  const bioElement = document.getElementById('profile-bio');
  const expElement = document.getElementById('profile-exp');
  const levelElement = document.getElementById('profile-level');

  // Get the user document from Firestore
  usersRef.doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        profilePicElement.src = userData.profilePicUrl;
        usernameElement.textContent = userData.username;
        bioElement.textContent = userData.bio;
        expElement.textContent = `Exp: ${userData.exp}`;
        levelElement.textContent = `Level: ${userData.level}`;
      } else {
        console.error('User not found');
      }
    })
    .catch(error => {
      console.error('Error getting user data:', error);
    });
}

const friendRequestsRef = db.collection('friendRequests');

// Send friend request
function sendFriendRequest(userId) {
  const user = auth.currentUser;

  // Check if friend request already exists
  friendRequestsRef
    .where('senderId', '==', user.uid)
    .where('receiverId', '==', userId)
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        console.log('Friend request already sent');
        return;
      }

      // Create a new friend request
      const friendRequest = {
        senderId: user.uid,
        receiverId: userId,
        status: 'pending'
      };

      // Add the friend request to Firestore
      friendRequestsRef
        .add(friendRequest)
        .then(() => {
          console.log('Friend request sent');
        })
        .catch(error => {
          console.error('Error sending friend request:', error);
        });
    })
    .catch(error => {
      console.error('Error checking friend request:', error);
    });
}

// Accept friend request
function acceptFriendRequest(friendRequestId) {
  const user = auth.currentUser;

  // Get the friend request document
  friendRequestsRef
    .doc(friendRequestId)
    .get()
    .then(doc => {
      if (doc.exists) {
        const friendRequest = doc.data();

        // Check if the friend request is for the current user
        if (friendRequest.receiverId === user.uid) {
          // Update the friend request status to 'accepted'
          friendRequestsRef
            .doc(friendRequestId)
            .update({ status: 'accepted' })
            .then(() => {
              console.log('Friend request accepted');
            })
            .catch(error => {
              console.error('Error accepting friend request:', error);
            });
        } else {
          console.error('Invalid friend request');
        }
      } else {
        console.error('Friend request not found');
      }
    })
    .catch(error => {
      console.error('Error retrieving friend request:', error);
    });
}

// Real-time listener for friend requests
function listenForFriendRequests() {
  const user = auth.currentUser;

  friendRequestsRef
    .where('receiverId', '==', user.uid)
    .where('status', '==', 'pending')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const friendRequest = change.doc.data();
          console.log('New friend request:', friendRequest);

          // Optionally, you can display a notification to the user
        }
      });
    });
}

// Real-time listener for messages
function listenForMessages() {
  const user = auth.currentUser;

  messagesRef
    .where('participants', 'array-contains', user.uid)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const message = change.doc.data();
          console.log('New message:', message);

          // Optionally, update the message list in the UI
        }
      });
    });
}


// Send friend request
function sendFriendRequest(userId) {
  const user = auth.currentUser;

  // Check if friend request already exists
  friendRequestsRef
    .where('senderId', '==', user.uid)
    .where('receiverId', '==', userId)
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        console.log('Friend request already sent');
        return;
      }

      // Create a new friend request
      const friendRequest = {
        senderId: user.uid,
        receiverId: userId,
        status: 'pending'
      };

      // Add the friend request to Firestore
      friendRequestsRef
        .add(friendRequest)
        .then(() => {
          console.log('Friend request sent');
        })
        .catch(error => {
          console.error('Error sending friend request:', error);
        });
    })
    .catch(error => {
      console.error('Error checking friend request:', error);
    });
}

// Accept friend request
function acceptFriendRequest(friendRequestId) {
  const user = auth.currentUser;

  // Get the friend request document
  friendRequestsRef
    .doc(friendRequestId)
    .get()
    .then(doc => {
      if (doc.exists) {
        const friendRequest = doc.data();

        // Check if the friend request is for the current user
        if (friendRequest.receiverId === user.uid) {
          // Update the friend request status to 'accepted'
          friendRequestsRef
            .doc(friendRequestId)
            .update({ status: 'accepted' })
            .then(() => {
              console.log('Friend request accepted');
            })
            .catch(error => {
              console.error('Error accepting friend request:', error);
            });
        } else {
          console.error('Invalid friend request');
        }
      } else {
        console.error('Friend request not found');
      }
    })
    .catch(error => {
      console.error('Error retrieving friend request:', error);
    });
}

// Real-time listener for friend requests
function listenForFriendRequests() {
  const user = auth.currentUser;

  friendRequestsRef
    .where('receiverId', '==', user.uid)
    .where('status', '==', 'pending')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const friendRequest = change.doc.data();
          console.log('New friend request:', friendRequest);

          // Optionally, you can display a notification to the user
        }
      });
    });
}

// Real-time listener for messages
function listenForMessages() {
  const user = auth.currentUser;
  const messageList = document.getElementById('message-list');

  messagesRef
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const message = change.doc.data();

          // Display the message in the message list
          const messageItem = document.createElement('li');
          messageItem.textContent = message.content;
          messageList.appendChild(messageItem);
        }
      });
    });
}

function fetchUserChats() {
  const chatList = document.getElementById('chat-list');

  messagesRef
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const message = change.doc.data();

          // Display the message in the chat list
          const chatItem = document.createElement('li');
          chatItem.textContent = message.content;
          chatList.appendChild(chatItem);
        }
      });
    });
}

// Populate room options in the admin panel
function populateRoomOptions() {
  const roomSelect = document.getElementById('room-select');

  // Fetch room options from Firestore or any other data source
  // Add option elements to the roomSelect dropdown
}

// Join a room in the admin panel
function joinRoom() {
  const roomSelect = document.getElementById('room-select');
  const selectedRoom = roomSelect.value;

  // Logic to join the selected room
}

// Message a user in the admin panel
function messageUser() {
  const userSearchInput = document.getElementById('user-search');
  const userToMessage = userSearchInput.value;

  // Logic to send a message to the selected user
}

// Ban a user in the admin panel
function banUser() {
  const banSearchInput = document.getElementById('ban-search');
  const userToBan = banSearchInput.value;

  // Logic to ban the selected user
}

// Call the necessary functions to initialize the admin panel
function initializeAdminPanel() {
  fetchUserChats();
  populateRoomOptions();

  const joinButton = document.getElementById('join-button');
  joinButton.addEventListener('click', joinRoom);

  const messageButton = document.getElementById('message-button');
  messageButton.addEventListener('click', messageUser);

  const banButton = document.getElementById('ban-button');
  banButton.addEventListener('click', banUser);
}

// Admin login form submit
document.getElementById('admin-login-form').addEventListener('submit', e => {
  e.preventDefault();
  const adminEmailInput = document.getElementById('admin-email');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminEmail = adminEmailInput.value.trim();
  const adminPassword = adminPasswordInput.value;

  // Authenticate admin user
  authenticateAdmin(adminEmail, adminPassword)
    .then(adminUser => {
      if (adminUser) {
        // Admin authentication successful
        initializeAdminPanel();
      } else {
        console.error('Invalid admin credentials');
      }
    })
    .catch(error => {
      console.error('Error authenticating admin:', error);
    });

  // Clear the input fields
  adminEmailInput.value = '';
  adminPasswordInput.value = '';
});

// Authenticate admin user
function authenticateAdmin(email, password) {
  return new Promise((resolve, reject) => {
    // Check if the email and password match the admin credentials
    if (email === 'admin@raon.com' && password === 'raonuioplolA!') {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

// Call the necessary functions to initialize the admin panel
function initializeAdminPanel() {
  // Add your code here to initialize the admin panel
}
