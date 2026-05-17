using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common.Dto
{
    public class LoginResponseDto
    {
        public string Token { get; set; }
        public int UserId { get; set; }
    }
}

