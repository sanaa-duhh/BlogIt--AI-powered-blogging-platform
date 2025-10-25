import React, { useEffect, useRef, useState } from 'react'
import { assets, blogCategories } from '../../assets/assets'
import Quill from 'quill';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import {parse} from 'marked'

const AddBlog = () => {

    const {axios} = useAppContext()
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const editorRef = useRef(null)
    const quillRef = useRef(null)

    const [image, setImage] = useState(false);
    const [title, setTitle] = useState('');
    const [subTitle, setSubTitle] = useState('');
    const [category, setCategory] = useState('Startup');
    const [isPublished, setIsPublished] = useState(false);

    // Drag and Drop Handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            setImage(file);
            toast.success('Image uploaded successfully!');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            setImage(file);
            toast.success('Image uploaded successfully!');
        }
    };

    const generateContent = async ()=>{
        if(!title) return toast.error('Please enter a title')

        try {
            setLoading(true);
            const {data} = await axios.post('/api/blog/generate', {prompt: title})
            if (data.success){
                quillRef.current.root.innerHTML = parse(data.content)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }finally{
            setLoading(false)
        }
    }

    const onSubmitHandler = async (e) =>{
        try {
            e.preventDefault();
            setIsAdding(true)

            const blog = {
                title, subTitle, 
                description: quillRef.current.root.innerHTML,
                category, isPublished
            }

            const formData = new FormData();
            formData.append('blog', JSON.stringify(blog))
            formData.append('image', image)

            const {data} = await axios.post('/api/blog/add', formData);

            if(data.success){
                toast.success(data.message);
                setImage(false)
                setTitle('')
                setSubTitle('')
                quillRef.current.root.innerHTML = ''
                setCategory('Startup')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }finally{
            setIsAdding(false)
        }
        
    }

    useEffect(()=>{
        // Initiate Quill only once
        if(!quillRef.current && editorRef.current){
            quillRef.current = new Quill(editorRef.current, {theme: 'snow'})
        }
    },[])

  return (
    <form onSubmit={onSubmitHandler} className='flex-1 bg-blue-50/50 text-gray-600 h-full overflow-scroll'>
      <div className='bg-white w-full max-w-3xl p-4 md:p-10 sm:m-10 shadow rounded'>

        <p>Upload thumbnail</p>
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all mt-2 ${
                isDragging 
                    ? 'border-primary bg-primary/5 scale-102' 
                    : 'border-gray-300 hover:border-gray-400'
            }`}
        >
            {!image ? (
                <label htmlFor="image" className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-3">
                        <img src={assets.upload_area} alt="" className="h-16 opacity-60" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                {isDragging ? '📥 Drop image here' : 'Drag & drop your image here'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                        </div>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                        onChange={handleFileSelect}
                        type="file"
                        id="image"
                        accept="image/*"
                        hidden
                        required
                    />
                </label>
            ) : (
                <div className="relative">
                    <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded shadow-md"
                    />
                    <div className="mt-3 flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-600">
                            {image.name} ({(image.size / 1024).toFixed(2)} KB)
                        </p>
                        <button
                            type="button"
                            onClick={() => setImage(false)}
                            className="text-xs text-red-600 hover:text-red-800 hover:underline"
                        >
                            ✕ Remove image
                        </button>
                    </div>
                </div>
            )}
        </div>

        <p className='mt-4'>Blog title</p>
        <input type="text" placeholder='Type here' required className='w-full max-w-lg mt-2 p-2 border border-gray-300 outline-none rounded' onChange={e => setTitle(e.target.value)} value={title}/>

        <p className='mt-4'>Sub title</p>
        <input type="text" placeholder='Type here' required className='w-full max-w-lg mt-2 p-2 border border-gray-300 outline-none rounded' onChange={e => setSubTitle(e.target.value)} value={subTitle}/>

        <p className='mt-4'>Blog Description</p>
        <div className='max-w-lg h-74 pb-16 sm:pb-10 pt-2 relative'>
            <div ref={editorRef}></div>
            {loading && ( 
            <div className='absolute right-0 top-0 bottom-0 left-0 flex items-center justify-center bg-black/10 mt-2'>
                <div className='w-8 h-8 rounded-full border-2 border-t-white animate-spin'></div>
            </div> )}
            <button disabled={loading} type='button' onClick={generateContent} className='absolute bottom-1 right-2 ml-2 text-xs text-white bg-black/70 px-4 py-1.5 rounded hover:underline cursor-pointer'>Generate with AI</button>
        </div>

        <p className='mt-4'>Blog category</p>
        <select onChange={e => setCategory(e.target.value)} name="category" className='mt-2 px-3 py-2 border text-gray-500 border-gray-300 outline-none rounded'>
            <option value="">Select category</option>
            {blogCategories.map((item, index)=>{
                return <option key={index} value={item}>{item}</option>
            })}
        </select>

        <div className='flex gap-2 mt-4'>
            <p>Publish Now</p>
            <input type="checkbox" checked={isPublished} className='scale-125 cursor-pointer' onChange={e => setIsPublished(e.target.checked)}/>
        </div>

        <button disabled={isAdding} type="submit" className='mt-8 w-40 h-10 bg-primary text-white rounded cursor-pointer text-sm hover:bg-primary/90 transition-all'>
            {isAdding ? 'Adding...' : 'Add Blog'}
        </button>

      </div>
    </form>
  )
}

export default AddBlog