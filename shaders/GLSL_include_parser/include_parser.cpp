#include <fstream>
#include <string>
#include <iostream>

struct Node
{
    explicit Node(std::string data) : data_(data), next_(nullptr) {}
    
    std::string data_;
    Node * next_;
};

struct LinkedList
{
    LinkedList() : first_(nullptr), last_(nullptr) {}

    void push_back(std::string data)
    {
        Node * node = new Node(data);
        if (first_ == nullptr)
        {
            first_ = node;
            last_ = node;
        }
        else
        {
            last_->next_ = node;
            last_ = node;
        }
    }

    void insert(Node * ptr, std::string data)
    {
        Node * prev_next = ptr->next_;
        ptr->next_ = new Node(data);
        ptr->next_->next_ = prev_next;
    }

    ~LinkedList()
    {
        Node * ptr = first_;
        Node * next_ptr = ptr->next_;
        while (next_ptr)
        {
            delete ptr;
            ptr = next_ptr;
            next_ptr = next_ptr->next_;
        }
        delete ptr;
    }

    Node * first_;
    Node * last_;
};

bool insert_file(LinkedList &result_file, Node * ptr, std::string file_name)
{
    std::ifstream file;
    file.open(file_name);

    if (file.is_open())
    {
        std::string str;
        getline(file, str);
        ptr->data_ = str;

        while (getline(file, str))
        {
            result_file.insert(ptr, str);
            ptr = ptr->next_;
        }

        file.close();
        return true;
    }

    file.close();
    return false;
}

std::string get_file_name(std::string str)
{
    std::string file_name;
    for (size_t i = 10, size = str.size() - 1; i != size; ++i) file_name += str[i];
    return file_name;
}

int replace_include_directive(LinkedList &result_file)
{
    bool was_include = false;

    Node * ptr = result_file.first_;
    while (ptr)
    {   
        std::string str = ptr->data_;

        if (str.find("#include") != std::string::npos)
        {
            was_include = true;
            std::string include_file_name = get_file_name(str);
            if (!insert_file(result_file, ptr, include_file_name))
            {
                std::cout << "Error: file \"" << include_file_name << "\" not found\n";                
                return 2;
            } 
        }
        ptr = ptr->next_;
    }

    if (was_include) return 1;
    return 0;
}

bool from_file_to_buffer(const std::string path_to_file, LinkedList &result_file)
{
    std::ifstream file(path_to_file);
    if (!file.is_open()) return false;

    std::string str;
    while (getline(file, str)) result_file.push_back(str);
    
    return true;
}

void from_buffer_to_file(LinkedList &result_file)
{
    std::ofstream file("shader.frag");
    Node * ptr = result_file.first_;
    while (ptr)
    {
        file << ptr->data_ + "\n";
        ptr = ptr->next_;
    }
}

int main(int argc, char *argv[])
{
    if (argc > 1)
    {
       LinkedList result_file;

       if (from_file_to_buffer(argv[1], result_file))
       {
           int res = -1;
           do {
               res = replace_include_directive(result_file);
               if (res == 2) return 0;                              
           } while (res != 0);

           from_buffer_to_file(result_file);

           // output buffer
           // Node * ptr = result_file.first_;
           // while (ptr)
           // {           
           //     std::cout << ptr->data_ + "\n";
           //     ptr = ptr->next_;
           // }      

       } else std::cout << "Error: file \"" << argv[1] << "\" not found\n";
    } else std::cout << "Error: no input files\n";
    return 0;
}
