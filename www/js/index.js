function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  FCMPlugin.getToken(
    function (token) {
      console.log('FCM Token: ' + token);
      // You can store this token or send it to your server for further use
    },
    function (err) {
      console.error('Error retrieving FCM token: ' + err);
    }
  );
  // Handle incoming notifications
  FCMPlugin.onNotification(
    function (data) {
      console.log('Notification data: ' + JSON.stringify(data));

      if (data.wasTapped) {
        // Notification received in background
        alert('Background Notification: ' + JSON.stringify(data));
      } else {
        // Notification received in foreground
        alert('Foreground Notification: ' + JSON.stringify(data));
      }
    },
    function (msg) {
      console.log('Notification callback success: ' + msg);
    },
    function (err) {
      console.error('Notification callback error: ' + err);
    }
  );
}

document.addEventListener('deviceready', onDeviceReady, false);

const postContainer = document.querySelector('.post-list');


const postApiUrl = 'https://api.jsonbin.io/v3/b/66e7364facd3cb34a88505ba';
const apiKey = '$2a$10$axIrHAxiz3UX.tI0RDXKm.jQRqHbNa2q5/yk2aLrhwd2qFwOUw/Me'; // Replace with your actual API key
const userApiUrl = 'https://api.jsonbin.io/v3/b/66fba143e41b4d34e43b0849';

const addIncident = document.querySelector('.add-button');
const getLocationBtn = document.getElementById('get-location');
const getLocationValue = document.querySelector('.location-text');
const getDateBtn = document.getElementById('get-date');
const getDateValue = document.querySelector('.date-text');

let temporarilyStoreEditData = null;


let userPositionCoords = null;

let userSelectImageInbase64String = '';

let postStore = [];

/*
  email: string
  id: string
  password: string
  username: string
 */
let loginUserStore = null;

const openLoginPage = () => {
  document.querySelector('.auth-form').style.display = 'flex';
  document.querySelector('.incident-login').style.display = 'flex';
  document.querySelector('.incident-signup').style.display = 'none';

  document.querySelector('.incident-home').style.display = 'none';
  document.querySelector('.form-section').style.display = 'none';
};

const openSignUpPage = () => {
  document.querySelector('.auth-form').style.display = 'flex';
  document.querySelector('.incident-signup').style.display = 'flex';
  document.querySelector('.incident-login').style.display = 'none';

  document.querySelector('.incident-home').style.display = 'none';
  document.querySelector('.form-section').style.display = 'none';
};

const openIncidentFormPage = () => {
  document.querySelector('.auth-form').style.display = 'none';
  document.querySelector('.form-section').style.display = 'block';
  document.querySelector('.incident-home').style.display = 'none';
};

const opemIncidentPage = () => {
  document.querySelector('.auth-form').style.display = 'none';
  document.querySelector('.form-section').style.display = 'none';
  document.querySelector('.incident-home').style.display = 'block';


  document.querySelector('#display-user').innerHTML = loginUserStore?.username;
};

addIncident.addEventListener('click', function () {
  openIncidentFormPage();
});

document
  .querySelector('#open-sign-up-page-btn')
  .addEventListener('click', function () {
    openSignUpPage();
  });

document
  .querySelector('#open-login-page-btn')
  .addEventListener('click', function () {
    openLoginPage();
  });

document
  .querySelector('#log-out-btn')
  .addEventListener('click', function (event) {
    localStorage.removeItem('loginUserData');
    openLoginPage();
  });



// ============LOGIN==========

async function login(email, password) {
 const loginBtn = document.querySelector(
    '#login'
  );
  loginBtn.innerHTML = 'loading...'
  loginBtn.disabled = true;
  try {
    const response = await fetch(`${userApiUrl}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });

    const data = await response.json();

    const users = data.record.users || [];

    // find in array - let make everything to lower case so it easier to find
    const userExist = users.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password.toLowerCase() === password.toLowerCase()
    );
    if (userExist) {
      showAlert('success-alert', 'Successfully signed in');
      // store in localstore on device memory so we can redirect user
      localStorage.setItem('loginUserData', JSON.stringify(userExist));
      // save for later user
      opemIncidentPage();
      fetchAndDisplayPosts();
    } else {
      showAlert('error-alert', 'Seems you havent register. Please signup first');
    }
    loginUserStore = userExist;
    loginBtn.innerHTML = 'Login'
    loginBtn.disabled = false;
  } catch (error) {
    loginBtn.innerHTML = 'Login.'
    loginBtn.disabled = false;
    showAlert('error-alert', 'Error login post:', error?.message || error);
  }
}


async function signUp(username, email, password) {
  try {
    const response = await fetch(`${userApiUrl}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });

    const data = await response.json();

    const users = data.record.users || [];

    // find in array - let make everything to lower case so it easier to find
    const userExist = users.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase()
    );
    if (userExist) {
      // store in localstore on device memory so we can redirect user
      showAlert('error-alert', 'user email Already exist');
    } else {
      // Create a new user
      const newUser = {
        id: (users.length + 1).toString(),
        username,
        email,
        password,
      };

      users.push(newUser); // Add user to users array data

      // Update the API with the new posts array
      await fetch(userApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
        },
        body: JSON.stringify({ users }),
      });

      showAlert('success-alert', 'Successful, You are registered');

      // proceed to login
      openLoginPage();
    }
  } catch (error) {
    console.error('Error signing up:', error);
  }
}

// ===================

//the function that gets data from the api
async function fetchAndDisplayPosts() {
 // make category buttn with the id="All" active
  addClassById('All', 'active-btn');

  try {
    const response = await fetch(`${postApiUrl}/latest`, {
      headers: {
        'X-Master-Key': apiKey,
      },
    });

    // response to json --- so i would be easy to use the data
    const data = await response.json();

    postContainer.innerHTML = ''; // Clear previous posts

    // Check if the nested record field exists
    if (
      data.record &&
      data.record.record &&
      Array.isArray(data.record.record.posts)
    ) {
      const sortPostsByCreatedDate = data.record.record.posts.sort(
        (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
      );

      sortPostsByCreatedDate.forEach((post) => {
        displayPost(post);
      });

      // set postStore
      postStore = sortPostsByCreatedDate;
    } else {
      console.error('Invalid data structure:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

function displayPost(post) {
  const postElement = document.createElement('div');
  postElement.classList.add('post');
  postElement.setAttribute('data-id', post.id); // Set data-id for easier access
  postElement.innerHTML = `
           <div class="img">
             <img class="post-img" src="${post.imgBase64}" />
            </div>

          <p class="post-title">${post.title}</p>
          <p class="post-desc">${post.content}</p>

          <div class="post-category">
            <p>${post.category}</p>
            <p>${post.location?.latitude} ${post.location?.longitude}</p>
            <p>${formatDate(post.createdDate)}</p>
            <p>By ${loginUserStore?.username}<p/>

          </div>

          <div class="ed-del-btn">
            <button class="edit-btn">Edit<button/>
            <button class="delete-btn" >Delete</button>
          <div/>
      `;
  postContainer.appendChild(postElement);

  // Add event listener for delete button
  postElement
    .querySelector('.delete-btn')
    .addEventListener('click', function () {
      deletePost(post.id);
    });

  //Add event listener for edit button
  postElement.querySelector('.edit-btn').addEventListener('click', function () {
    populateEditPost(post);
  });
}

// Function to add a new post to the API
const addPost = async (title, content, category) => {
  const postBtn = document.querySelector(
    '#form-btn'
  );
  postBtn.innerHTML = 'posting...'
  postBtn.disabled = true;

  try {
    const response = await fetch(`${postApiUrl}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });

    const data = await response.json();

    console.log(data)
    const posts = data.record?.record?.posts || [];

    // Create a new post object
    const newPost = {
      id: (posts.length + 1).toString(),
      title,
      content,
      category,
      location: userPositionCoords,
      createdDate: new Date().toISOString(),
      imgBase64: userSelectImageInbase64String,
    };


    posts.push(newPost); // Add new post to the array


    // Update the API with the new posts array
    const addPostResponse = await fetch(postApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify({ record: { posts } }),
    });


    postBtn.innerHTML = 'Submit'
    postBtn.disabled = false;


    if(addPostResponse.status !== 201) {
      const message = await addPostResponse.json();

      showAlert('error-alert', message?.message || 'Seems there is an error while trying to post' );

      return;
    }

    showAlert('success-alert', 'Successful');


    fetchAndDisplayPosts(); // Refresh the displayed posts

    resetIncidentForm();
  } catch (error) {
    postBtn.innerHTML = 'Submit'
    postBtn.disabled = false;
    showAlert('error-alert', 'Error login post:', error?.message || error);
    console.error('Error adding post:', error?.message || error);
  }
};

//working on the edit functionaity as assignMent// Function to edit an existing post
async function editPost(editedPost) {
  try {
    const response = await fetch(`${postApiUrl}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });

    const data = await response.json();
    const posts = data.record?.record?.posts || [];

    // Find the index of the post to be edited
    const index = posts.findIndex((post) => post.id === editedPost.id);
    if (index === -1) throw new Error('Error while trying to update post');

    posts[index] = editedPost; // Update the post at the found index

    // Update the API with the modified posts array
    await fetch(postApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify({ record: { posts } }),
    });

    fetchAndDisplayPosts(); // Refresh the displayed posts

    resetIncidentForm();
  } catch (error) {
    console.error('Error updating post:', error);
  }
}

function populateEditPost(post) {
  openIncidentFormPage();
  //we target the the title and content inputs
  const titleId = document.querySelector('#title');
  const contentId = document.querySelector('#content');
  const categorySelect = document.querySelector('#category');


  //we set the value of the title and content to that of the clicked existing post ....
  titleId.value = post.title;
  contentId.value = post.content;
  categorySelect.value = post.category;

  // change button text, when we are editing button should be update post but when not editing but remains as it is
  document.querySelector('#form-btn').textContent = 'Update Post';

  // i will save in temporarilyStoreEditData the post i want to edit
  temporarilyStoreEditData = post;

  setFormImageAndPreview(post.imgBase64);
}

// Function to delete a post
async function deletePost(postId) {
  try {
    const response = await fetch(`${postApiUrl}/latest`, {
      headers: { 'X-Master-Key': apiKey },
    });

    const data = await response.json();
    const updatedPosts = data.record.record.posts.filter(
      (post) => post.id !== postId
    ); // Filter out the post to delete

    // Update the API with the new posts array
    await fetch(postApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify({ record: { posts: updatedPosts } }),
    });

    fetchAndDisplayPosts(); // Refresh the displayed posts
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

// Handle form submission =======

document
  .getElementById('login-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const email = formData.get('email');
    const password = formData.get('password');

    console.log('login:::', email, password);
    login(email, password);
  });

document
  .getElementById('register-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');


    signUp(username, email, password);
  });

document
  .getElementById('incident-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const title = formData.get('title');
    const content = formData.get('content');
    const category = formData.get('category');

    // if temporarilyStoreEditData isnt null then i am editing a post else new post - we set data in populateEditPost function when user clicks edit button
    if (temporarilyStoreEditData && temporarilyStoreEditData?.id) {
      const edittedPost = {
        id: temporarilyStoreEditData?.id, // post id we are trying to edit
        location: userPositionCoords, // update location
        imgBase64: userSelectImageInbase64String, // we get base64 Image
        createdDate: new Date().toISOString(), // we change the created dat as we are updating - though we can add a new field callsed updated field
        // add other field before submitting
        title,
        content,
        category,
      };
      editPost(edittedPost);
    } else {
      addPost(title, content, category);
    }
  });

//---------------------------------------------
///GET DATE OF INCIDENT AUTOmATICALLY 

const formatDate = (theDate) => {
  const date = new Date(theDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = date.getFullYear();

  // Get hours and format for AM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, '0') : '12'; // the hour '0' should be '12'

  return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`; // output example 31/10/2024 - 06:00 AM
};


///GET INCIDENT LOCATION - show users though
const onSuccess = (position) => {
  
  userPositionCoords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};

// create a div to display data error and successs data so you can add in this function and also on submit o post you show user success message
const onError = (error) => {
  if (error.code === error.TIMEOUT) {
  } else {
  }
};

const myLocation = () => {
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
};


//----- manage file change

const setFormImageAndPreview = (base64String) => {
  // if we have data then set else just ignore jare
  if (base64String) {
    const img = document.getElementById('preview');
    img.src = base64String;
    img.style.display = 'block';
    // save Base64 string
    userSelectImageInbase64String = base64String;

    // hid image place holder
    document.querySelector('.image-placeholder').style.display = 'none';
    // hid remove buttom
    document.querySelector('.remove-btn-div').style.display = 'none';
  }
};

const clearImage = () => {
  const img = document.getElementById('preview');
  img.src = '';
  img.style.display = 'none';
  //set null
  userSelectImageInbase64String = null;

  // show image placeholde
  document.querySelector('.image-placeholder').style.display = 'flex';
  // hid remove button in the case it is visible
  document.querySelector('.remove-btn-div').style.display = 'none';
};

document
  .getElementById('fileInput')
  .addEventListener('change', function (event) {
    const file = event.target.files[0];
    const targetSizeKB = 20; // Target size in KB - up to 27kb
    const targetSize = targetSizeKB * 1024; // Convert KB to bytes

    const img = new Image();
    const reader = new FileReader();

    // Set crossOrigin to handle potential CORS issues
    img.crossOrigin = 'Anonymous';

    reader.onload = async (event) => {
      img.src = event.target.result;

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let quality = 1; // Start with full quality
        let base64Image;

        // Resize loop
        while (true) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to Base64
          base64Image = canvas.toDataURL('image/jpeg', quality);
          const base64Size =
            (base64Image.length * 3) / 4 -
            (base64Image.indexOf(',') > -1 ? 1 : 0);

          if (base64Size <= targetSize || quality <= 0.05) {
            break; // Stop if under target size or quality too low
          }

          quality -= 0.05; // Reduce in smaller increments
        }

        // Final size check
        const finalSize =
          (base64Image.length * 3) / 4 -
          (base64Image.indexOf(',') > -1 ? 1 : 0);
        if (finalSize > targetSize) {
          alert(
            `Unable to reduce image size to 20KB. Current size: ${(
              finalSize / 1024
            ).toFixed(2)}KB`
          );
        } else {
          setFormImageAndPreview(base64Image);
        }
      };
    };

    reader.readAsDataURL(file);
  });

// remove image btn
document
  .querySelector('#remove-btn')
  .addEventListener('click', function (event) {
    clearImage();
  });

document.querySelector('#back-btn').addEventListener('click', function (event) {
  resetIncidentForm();
});

const resetIncidentForm = () => {
  document.querySelector('#title').value = '';
  document.querySelector('#content').value = '';
  document.querySelector('#category').value = '';

  document.querySelector('#form-btn').textContent = 'Add Post'; // Reset button text

  clearImage();

  opemIncidentPage();
};

// Function to add a class by button ID
function addClassById(buttonId, className) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.classList.add(className);
  }
}

// Function to reset all buttons
function resetButtons(className) {
  const buttons = document.querySelectorAll('.select-incident-category button');
  buttons.forEach((button) => {
    button.classList.remove(className);
  });
}

function filterCategoryType(categoryType) {
  postContainer.innerHTML = ''; // Clear previous posts
  const filtered =
    categoryType === 'All'
      ? postStore
      : postStore.filter((v) => v.category === categoryType);

  filtered.forEach((post) => {
    displayPost(post);
  });
}

// Adding event listeners to all category buttons on incident page
const categoryButtons = document.querySelectorAll(
  '.select-incident-category button'
);
categoryButtons.forEach((button) => {
  button.addEventListener('click', function (event) {
    const buttonId = event.target.id; // Get the ID from the event target
    resetButtons('active-btn'); // Reset other buttons
    addClassById(buttonId, 'active-btn'); // Add class to the clicked button */
    filterCategoryType(buttonId);
  });
});



const showAlert = (type, alartMessage) => {
  const alertTypeId = type === 'error-alert' ? '#error-alert' : '#success-alert';

  const alertDiv = document.querySelector(alertTypeId);

  // get the .alert-content in the selected dom
  alertDiv.querySelector('.alert-content').innerHTML = alartMessage || '';

  alertDiv.classList.add('show');
  setTimeout(() => {
    alertDiv.classList.remove('show');
  }, 3200);
}











/// on load of app do this things below
// =====================================
// initiate cordination - we need to do it this way (it kinda slow to get the data), so we get it in the background first
if ('geolocation' in navigator) {
  /* geolocation is available */
  myLocation();
} else {
  /* geolocation IS NOT available */
  console.log('seems geolocation isnt supported on this device');
}

// when we log the app - we check if a user is login because we store the data and just redirect to the incident post page
const getLoginUser = localStorage.getItem('loginUserData');

if (getLoginUser) {
  const userData = JSON.parse(getLoginUser);
  // save in the store for later user
  loginUserStore = userData;
  opemIncidentPage();
  fetchAndDisplayPosts();
} else {
  console.log('No user found in local storage.');
  openLoginPage();
}
//-------------------------------------------------------------
