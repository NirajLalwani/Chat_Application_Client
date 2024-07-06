import React, { useState, useContext, createContext, useEffect } from 'react'
import { GetUserDataRoute, GetConversationRoute, GetAllUsersDataRoute } from '../utils/routes';
const Context = createContext();
const UserContextProvider = ({ children }) => {

    const [isLoggedIn, setIsLoggedIn] = useState(true)
    const [userData, setUserData] = useState({
        userId: ""
    });
    const [userConversation, setUserConversations] = useState([]);



    const GetUserConversations = async (Id) => {
        const response = await fetch(`${GetConversationRoute}/${Id}`)
        const data = await response.json();
        if (response.status === 200) {
            setUserConversations(data.OtherUserData)
        } else {
            console.log(data)
        }
    }

    const [users, setUsers] = useState([])
    const fetchAllUsers = async () => {
        const response = await fetch(GetAllUsersDataRoute);
        const resData = await response.json();
        setUsers(resData.Data);
    }

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

    const [messagesData, setMessagesData] = useState({
        ReceiverId: "",
        ReceiverName: "",
        ReceiverImage: "",
        ReceiverEmail: "",
        messages: [],
        conversationId: ""
    })




    const [filterUsers, setFilterConversation] = useState([])

    useEffect(() => {
        const filteredUsers = users.filter((user) => {
            const hasConversation = userConversation.some((conversation) => {
                return user._id === conversation.userId;
            });

            // Return true to include user if there's no conversation found
            return !hasConversation;
        });

        setFilterConversation(filteredUsers);

    }, [userConversation])


    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            AuthorizeUser(storedToken);
        } else {
            setIsLoggedIn(false)
        }

    }, [])

    return (
        <>
            <Context.Provider value={{ isLoggedIn, AuthorizeUser, userData, userConversation, users, messagesData, setMessagesData, filterUsers, setIsLoggedIn, setUserConversations }}>
                {children}
            </Context.Provider >
        </>
    )
}


export const useUserContext = () => {
    return useContext(Context)
}
export default UserContextProvider
