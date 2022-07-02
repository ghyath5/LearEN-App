import axios from "axios";
import { SERVER_URL } from "./constants";

export async function network() {
    return axios.create({
        baseURL: SERVER_URL,
        // baseURL: "http://localhost:8000",
        headers: await prepareHeaders(),
        timeout: 50000,
    })
}

async function prepareHeaders() {
    let headers = {
        "Content-Type": "application/json",
        //set the default language to arabic as specified by Rami
        //  "language" : JSON.parse(AsyncStorage.getItem("language")) || "ar",
    }
    // if (token) {
        headers = {
        ...headers,
        }
    // } 
    return headers
}