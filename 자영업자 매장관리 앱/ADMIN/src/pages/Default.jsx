import { useState, useEffect } from 'react'


export default function Default() {


    useEffect(() => {


    }, [])


    return <div>
        Default page! {location.pathname}
    </div>
}