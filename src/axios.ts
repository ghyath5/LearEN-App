import axios from "axios";
import { SERVER_URL } from "./constants";

export function network() {
    return axios.create({
        baseURL: SERVER_URL,
        // baseURL: "http://localhost:8000",
        headers: prepareHeaders(),
        timeout: 50000,
    })
}

function prepareHeaders() {
    let headers = {
        "Content-Type": "application/json",
    }
    return headers
}