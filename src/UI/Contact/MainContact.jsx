import React from 'react'
import { Link } from 'react-router-dom'

function MainContact() {
  return (
    <div>

        <div className=' h-[500px] w-full flex flex-col justify-center items-center  contact'>
          <p className=' text-8xl font-black text-purple-900'>Contact us</p>
          <div>
            <div className="flex items-center py-4 overflow-x-auto whitespace-nowrap">
    <Link to="/" className="text-gray-600 dark:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
    </Link>

    <span className="mx-5 text-gray-500 dark:text-gray-300 rtl:-scale-x-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
    </span>

    <Link to="#" className="text-gray-600 dark:text-gray-200 hover:underline">
        Contact us
    </Link>

</div>
          </div>
        </div>
        <section className="bg-white dark:bg-gray-900 bg-gradient-to-b from-white to-purple-50">
    <div className="container px-6 py-12 mx-auto">
        <div className="lg:flex lg:items-center lg:-mx-6">
            <div className="lg:w-1/2 lg:mx-6">
                <h1 className="text-2xl font-semibold text-gray-800 capitalize dark:text-black lg:text-6xl">
                    Contact us for <br/> more info
                </h1>

                <div className="mt-6 space-y-8 md:mt-8">
                    <p className="flex items-start -mx-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-2 text-purple-900 dark:text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>

                        <span className="mx-2 text-gray-700 w-72 dark:text-gray-400">
                            Cecilia Chapman 711-2880 Nulla
                            St. Mankato Mississippi 96522
                        </span>
                    </p>

                    <p className="flex items-start -mx-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-2 text-purple-900 dark:text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>

                        <span className="mx-2 text-gray-700 truncate w-72 dark:text-gray-400">(257) 563-7401</span>
                    </p>

                    <p className="flex items-start -mx-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-2 text-purple-900 dark:text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>

                        <span className="mx-2 text-gray-700 truncate w-72 dark:text-gray-400">acb@example.com</span>
                    </p>
                </div>

                <div className="mt-6 w-80 md:mt-8">
                    <h3 className="text-gray-600 dark:text-gray-300 ">Follow us</h3>

                    <div className="flex mt-4 -mx-1.5 ">
                        <a className="mx-1.5 my-1.5  transition-colors duration-300 transform hover:scale-110" href="#">
                           <svg className="w-6 h-6 " xmlns="http://www.w3.org/2000/svg" fill="gray"  viewBox="0 0 32 32" version="1.1">
                                <path d="M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z"/>
                    </svg>
                        </a>

                        <a className="mx-1.5 text-gray-400 transition-colors duration-300 transform hover:scale-110" href="#">
                            <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="-9.67 -8.48 402.12 215.73"><g fill="gray">
                                <path d="M56.51 49.21c-3.86 11.58.77 24.7 10.42 38.4 33.38-18.14 68.89-29.33 85.68-33.38 27.4-6.95 29.91 23 28.56 22.58-20.84-3.29-66.17 6.94-103.62 24.89 13.5 18.14 19.29 34 14.85 55.38-7.14 32.8-41.29 50.17-69.46 38.78C4.8 188.72-9.67 164.8 8.08 137.78c8.49-13.31 21-25.08 35.31-35.31-11-18.33-12.39-39.37-2.7-55.77 12.54-21 36.47-30.87 52.1-23.73 22.58 10.61 15.82 31.84 4.21 39.75-22.19 15-28.17-9.07-28.17-9.07 23.35-5.4 24.89-19.1 17.56-22.58C72.91 24.9 61 36.09 56.51 49.21zm-3.86 66.38c-10.22 7-18.91 14.47-24.7 22.19-16 21.61-10.42 43.8 2.13 49.4 15.63 7.53 35.31-.39 40.71-21.23 4.21-16.01-1.74-29.52-18.14-50.36z"/>
                                <path d="M135 148.2c21.42-9.26 22.58-45.92 14.86-48-7.91-2.31-16 17.18-19.49 30.49-4.24 16-3.09 37.82 12.16 40.91 16.21 3.28 35.5-9.84 41.29-25.86a.19.19 0 0 1 .2-.19c3.66-1.16 6.56 1.35 4.24 7.53-7.91 20.06-32.42 35.12-57.5 29.71-14.67-3.28-30.68-21.8-25.67-49.2 5.21-27.4 25.28-45.93 50.37-41.49 35.7 6.56 25.28 48.24-20.84 63.48.04-.05-6.91-4.1.38-7.38z"/>
                                <path d="M202.38 124.47c-2.7 21.61-.38 42.26 7.72 45.34 5.79 2.32 13.9-10.42 18.72-24.31h.39c3.47-1.35 6.56 1.35 4 7.53-7.14 18.33-22.58 33.57-35.51 28-16-7.14-20.64-31.07-17.17-62.72C186.56 67 216.47-8.48 241.75.78c17.56 6.56.38 63.87-39.37 123.69zm3.67-21.61c23.74-40.33 36.08-76.8 30.3-82-6.95-6.19-21.81 41.14-30.3 82z"/>
                                <path d="M316.81 152.83c-7.14 18.53-20.45 32-35.5 28-8.69-2.12-12.74-10.8-13.9-23.15-4.82 10.8-12.93 21.42-25.28 22.19-15.24 1.16-22.77-12.54-20.45-25.09 2.12-11.4 10.81-20.09 25.32-22.78a136.1 136.1 0 0 0 21.8-6.17c.39-3.09 1-6 1.35-9.07 1.55-8.68-.38-20.07-8.49-21.81-9.64-2.12-16.4 1-18.71 8.49-3.28 10.42 7.52 13.51 17 4.44 0 0 9.84 13.12-3.67 18.14-14.47 5.6-28.36-4.05-23.54-20.84 3.67-12.16 16.4-23 37.63-18.33 17.36 3.86 25.85 15.63 19.87 48-3.28 17.36-2.89 33.57 2.9 34.92 6.17 1.35 14.47-10.61 19.29-24.31h.2c3.6-1.31 6.5 1.39 4.18 7.37zM268 132.57l-7.14 2.32c-8.3 2.51-12.35 6.17-14.47 13.89-2.7 10-.58 16.6 4.82 17.17 5.41.39 12-8.68 16.41-29.13z"/>
                                <path d="M348.07 93s-4.06 3.28-7.72 24.51c13.12-26 25.86-31.45 36.66-29.72 10 1.74 15.44 9.85 5 35.12-6.18 15.06-28.37 2.9-28.37 2.9 9.46-9.46 14.47-23.35 9.84-25.09-4.82-1.35-13.31 9.84-26.24 40.33-4.63 37.44-11.58 45.54-29.52 37.44 0 0 2.31-3.28 3.09-9.84 4.63-44 1.93-72.17 14.08-80.08 12.95-8.68 23.18 4.43 23.18 4.43z"/>
                            </g>
                            </svg>
                        </a>

                        <a className="mx-1.5 text-gray-400 transition-colors duration-300 transform hover:scale-110" href="#">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 10.2222V13.7778H9.66667V20H13.2222V13.7778H15.8889L16.7778 10.2222H13.2222V8.44444C13.2222 8.2087 13.3159 7.9826 13.4826 7.81591C13.6493 7.64921 13.8754 7.55556 14.1111 7.55556H16.7778V4H14.1111C12.9324 4 11.8019 4.46825 10.9684 5.30175C10.1349 6.13524 9.66667 7.2657 9.66667 8.44444V10.2222H7Z" fill="currentColor" />
                            </svg>
                        </a>

                        <a className="mx-1.5 text-gray-400 transition-colors duration-300 transform hover:scale-110" href="#">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.9294 7.72275C9.65868 7.72275 7.82715 9.55428 7.82715 11.825C7.82715 14.0956 9.65868 15.9271 11.9294 15.9271C14.2 15.9271 16.0316 14.0956 16.0316 11.825C16.0316 9.55428 14.2 7.72275 11.9294 7.72275ZM11.9294 14.4919C10.462 14.4919 9.26239 13.2959 9.26239 11.825C9.26239 10.354 10.4584 9.15799 11.9294 9.15799C13.4003 9.15799 14.5963 10.354 14.5963 11.825C14.5963 13.2959 13.3967 14.4919 11.9294 14.4919ZM17.1562 7.55495C17.1562 8.08692 16.7277 8.51178 16.1994 8.51178C15.6674 8.51178 15.2425 8.08335 15.2425 7.55495C15.2425 7.02656 15.671 6.59813 16.1994 6.59813C16.7277 6.59813 17.1562 7.02656 17.1562 7.55495ZM19.8731 8.52606C19.8124 7.24434 19.5197 6.10901 18.5807 5.17361C17.6453 4.23821 16.51 3.94545 15.2282 3.88118C13.9073 3.80621 9.94787 3.80621 8.62689 3.88118C7.34874 3.94188 6.21341 4.23464 5.27444 5.17004C4.33547 6.10544 4.04628 7.24077 3.98201 8.52249C3.90704 9.84347 3.90704 13.8029 3.98201 15.1238C4.04271 16.4056 4.33547 17.5409 5.27444 18.4763C6.21341 19.4117 7.34517 19.7045 8.62689 19.7687C9.94787 19.8437 13.9073 19.8437 15.2282 19.7687C16.51 19.708 17.6453 19.4153 18.5807 18.4763C19.5161 17.5409 19.8089 16.4056 19.8731 15.1238C19.9481 13.8029 19.9481 9.84704 19.8731 8.52606ZM18.1665 16.5412C17.8881 17.241 17.349 17.7801 16.6456 18.0621C15.5924 18.4799 13.0932 18.3835 11.9294 18.3835C10.7655 18.3835 8.26272 18.4763 7.21307 18.0621C6.51331 17.7837 5.9742 17.2446 5.69215 16.5412C5.27444 15.488 5.37083 12.9888 5.37083 11.825C5.37083 10.6611 5.27801 8.15832 5.69215 7.10867C5.97063 6.40891 6.50974 5.8698 7.21307 5.58775C8.26629 5.17004 10.7655 5.26643 11.9294 5.26643C13.0932 5.26643 15.596 5.17361 16.6456 5.58775C17.3454 5.86623 17.8845 6.40534 18.1665 7.10867C18.5843 8.16189 18.4879 10.6611 18.4879 11.825C18.4879 12.9888 18.5843 15.4916 18.1665 16.5412Z" fill="currentColor" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-8 lg:w-1/2 lg:mx-6">
                <div
                    className="w-full px-8 py-10 mx-auto overflow-hidden bg-[transparent] rounded-lg shadow-2xl  lg:max-w-xl shadow-gray-300/50 dark:shadow-black/50 ">
                    <h1 className="text-lg font-medium text-gray-700">What do you want to ask</h1>

                    <form className="mt-6">
                        <div className="flex-1">
                            <label className="block mb-2 text-sm text-gray-600 dark:text-gray-500">Full Name</label>
                            <input type="text" placeholder="Felix Jennifer" className="block w-full px-5 py-3 mt-2 text-gray-800 placeholder-gray-200 bg-white border border-gray-200 rounded-md  dark:bg-[transparent]  dark:border-gray-700 focus:border-purple-200 dark:focus:border-purple-200 focus:ring-purple-200 focus:outline-none focus:ring focus:ring-opacity-40" />
                        </div>

                        <div className="flex-1 mt-6">
                            <label className="block mb-2 text-sm text-gray-600 dark:text-gray-500">Email address</label>
                            <input type="email" placeholder="FelixJennifer@example.com" className="block w-full px-5 py-3 mt-2 text-gray-800 placeholder-gray-200 bg-white border border-gray-200 rounded-md  dark:bg-[transparent] dark:border-gray-700 focus:border-purple-200 dark:focus:border-purple-200 focus:ring-purple-200 focus:outline-none focus:ring focus:ring-opacity-40" />
                        </div>

                        <div className="w-full mt-6">
                            <label className="block mb-2 text-sm text-gray-600 dark:text-gray-500">Message</label>
                            <textarea placeholder="message" className="block w-full px-5 py-3 mt-2 text-gray-800 placeholder-gray-200 bg-white border border-gray-200 rounded-md dark:bg-[transparent] dark:border-gray-700 focus:border-purple-200 md:h-48 dark:focus:border-purple-200 focus:ring-purple-200 focus:outline-none focus:ring focus:ring-opacity-40" ></textarea>
                        </div>

                        <button className="w-full px-6 py-3 mt-6 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-purple-900 rounded-md hover:bg-purple-800 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50">
                            get in touch
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</section>
 
  {/* <div className="overflow-hidden rounded-lg lg:col-span-2 h-96 lg:h-auto">
                <iframe width="100%" height="100%" frameBorder="0" title="map" marginHeight="0" marginWidth="0" scrolling="no" src=""></iframe>
            </div> */}

    </div>
    
  )
}

export default MainContact