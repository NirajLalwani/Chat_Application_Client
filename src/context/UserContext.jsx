import React, { useState, useContext, createContext, useEffect } from 'react'
import { GetUserDataRoute, GetConversationRoute, GetAllUsersDataRoute } from '../utils/routes';
const Context = createContext();
const UserContextProvider = ({ children }) => {

    const [isLoggedIn, setIsLoggedIn] = useState(true)
    const [userConversation, setUserConversations] = useState([]);
    const [users, setUsers] = useState([])
    const [userData, setUserData] = useState({
        userId: ""
    });

    //?It consits data of receiver along with sender and receiver conversation id
    const [messagesData, setMessagesData] = useState({
        ReceiverId: "",
        ReceiverName: "",
        ReceiverImage: "",
        ReceiverEmail: "",
        messages: [],
        conversationId: "",
        ReceiverTypingMessage: ""
    })


    const GetUserConversations = async (Id) => {    //?Called when user is valid
        const response = await fetch(`${GetConversationRoute}/${Id}`)
        const data = await response.json();
        if (response.status === 200) {
            setUserConversations(data.OtherUserData)
        } else {
            console.log(data)
        }
    }


    //?Getting all userData
    const fetchAllUsers = async () => {         //?Called when user is valid
        const response = await fetch(GetAllUsersDataRoute);
        const resData = await response.json();
        setUsers(resData.Data);
    }

    //?Function For Checking token is valid or not
    const AuthorizeUser = async (token) => {
        const response = await fetch(`${GetUserDataRoute}/${token}`)
        const data = await response.json();
        if (response.status === 200) {

            setUserData(data)
            setIsLoggedIn(true)
            GetUserConversations(data.userId);
            fetchAllUsers();
        } else {
            setIsLoggedIn(false);
            localStorage.removeItem('token');
            setUserData({})
        }
    }


    //?filterUsers is displyed on Add new user if new userConversation is added then again filter users  
    const [filterUsers, setFilterConversation] = useState([])
    const filter = () => {
        const filteredUsers = users.filter((user) => {                              //?users var conisists of all users
            const hasConversation = userConversation.some((conversation) => {      //?Finding current user in userConversation if it exists don't return it
                return user._id === conversation.userId;
            });

            // Return true to include user if there's no conversation found
            return !hasConversation;
        });
        setFilterConversation(filteredUsers);
    }
    useEffect(() => {
        filter();
    }, [userConversation])


    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            AuthorizeUser(storedToken); //?Verify That token is valid or not if token is valid currently logged in user data is setted in state Variable
        } else {
            setIsLoggedIn(false)
        }

    }, [])

    return (
        <>
            <Context.Provider value={{ isLoggedIn, AuthorizeUser, userData, userConversation, users, messagesData, setMessagesData, filterUsers, setIsLoggedIn, setUserConversations, filter, setUserData, setFilterConversation }}>
                {children}
            </Context.Provider >
        </>
    )
}


export const useUserContext = () => {
    return useContext(Context)
}
export default UserContextProvider
